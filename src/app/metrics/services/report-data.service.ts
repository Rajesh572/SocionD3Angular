import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { forkJoin, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportDataService {

  requestBody = [];
  programDetails = {
    progrma_name: 'Hepatitis - c Awareness',
    program_id: 30
};

selectedVerticalAttr: string;
selectedHorizontalAttr: string;

titleInfo = {'Session Completed': 'Sessions Completed',
'Generate Attestation': 'Participant Attestations',
TRAINEE: 'Unique Participants',
TRAINER: 'Unique Trainers',
'Download Content': 'Content Views'};

  initialHorizontalAttrSelected = 'Time Period';
  initialVerticalAttrSelected = 'Session Completed';
  initialGranularity = 'month';

//   requestDimensionAndGranularity = [{'Time Period': {
//     dimension: 'topic_name',
//     granularity: 'Month',
//   }},
//   {'Location': {
//     dimension: 'location',
//     granularity: 'All',
//   }}
// ];

verticalDatabaseKey = {'Session Completed': 'event_type',
'Generate Attestation': 'event_type',
TRAINEE: 'role',
TRAINER: 'role',
'Download Content': 'event_type'};

  chartOptionsForTP = [{
    granularity: 'month',
    dimension: ['month'],
    unique: false
  },
  {
    granularity: 'month',
    dimension: ['topic_name', 'month'],
    unique: false
  }
  ];

  chartOptionsForLC = [{
    granularity: 'All',
    dimension: ['location'],
    unique: false
  },
  {
    granularity: 'All',
    dimension: ['topic_name', 'location'],
    unique: false
  }
  ];

  filter = {};
  viewByData = {};

  constructor(private http: HttpClient) { }


  setSelectedHorizontalAttr(horizontalAxisSelected: string) {
    if (!!horizontalAxisSelected) {
      this.selectedHorizontalAttr = horizontalAxisSelected;
      let newRequestBody;
      console.log('1234: ', this.selectedHorizontalAttr);
      if (this.selectedHorizontalAttr === 'location') {
        newRequestBody = this.getRequestBody();
        newRequestBody[0].dimension = 'district';
        newRequestBody[1].dimension = ['topic_name', 'district'];
      } else if (this.selectedHorizontalAttr === 'Time Period') {
        newRequestBody = this.getRequestBody();
        newRequestBody[0].granularity = 'month';
        newRequestBody[0].dimension = [];
        newRequestBody[1].granularity = 'month';
        newRequestBody[1].dimension = ['topic_name'];
      }
      this.requestBody = newRequestBody;
    }
  }

  getSelectedHorizontalAttr() {
    if (!!this.selectedHorizontalAttr) {
      return this.selectedHorizontalAttr;
    } else {
      return this.initialHorizontalAttrSelected;
    }
  }

  setSelectedVerticalAttr(verticalAxisSelected: string) {
    if (!!verticalAxisSelected) {
      this.selectedVerticalAttr = verticalAxisSelected;
    }
  }

  getSelectedVerticalAttr() {
    if (!!this.selectedVerticalAttr) {
      return this.selectedVerticalAttr;
    } else {
      return this.initialVerticalAttrSelected;
    }
  }

  setSelectedVerticalAttrOnValue(value) {
    const index = Object.values(this.titleInfo).indexOf(value);
    const key = Object.keys(this.titleInfo)[index];
    this.selectedVerticalAttr = key;
  }

  getSelectedVerticalAttrText() {
    if (!!this.selectedVerticalAttr) {
      return this.titleInfo[this.selectedVerticalAttr];
    } else {
      return this.titleInfo[this.initialVerticalAttrSelected];
    }
  }

  getVerticalAttrText(verticalAxis) {
      return this.titleInfo[verticalAxis];
  }


    applyFiltersToRequestBody(filter) {
      if (!!filter) {
        this.filter = filter;
      }
      // this.initializeRequestBody();

      const filterKeys = Object.keys(filter);
      filterKeys.forEach((element) => {
        this.requestBody.forEach((item) => {
          item.filter[element] = filter[element];
        });
      });
    }

    setFilter(filter) {
      this.filter = filter;
    }

  initializeRequestBody() {
    this.requestBody = [];
    let chartOptions;
    if (this.selectedHorizontalAttr === 'location') {
      chartOptions = this.chartOptionsForLC;
    } else {
      chartOptions = this.chartOptionsForTP;
    }
    chartOptions.forEach((option) => {
      const requestBody = {...option};
      // if(this.selectedHorizontalAttr === 'location') {
      //   if (requestBody.dimension.indexOf('location') < 0) {
      //     requestBody.dimension.push('location');
      //   }
      // }
      // console.log('option : ', option);
      // const requestBody = this.checkUniqueOption(option);
      // const paramObject = this.createParamsObject(option.params);
      // requestBody['params'] = paramObject;
      const key = this.verticalDatabaseKey[this.getSelectedVerticalAttr()];
      if(key === 'role') {
        requestBody.unique = true;
        requestBody['unique_param'] = 'user_id';
      }
      const filterObject = this.createFilterObject(this.programDetails.program_id);
      // console.log('Filter : ', filterObject);
      requestBody['filter'] = filterObject;
      // console.log('Request : ', requestBody);
      this.requestBody.push(requestBody);
      if (Object.keys(this.filter).length > 0) {
        this.applyFiltersToRequestBody(this.filter);
      }
    });
  }

  createFilterObject(programId) {
    const filter = {};
    filter['program_id'] = programId;
    const key = this.verticalDatabaseKey[this.getSelectedVerticalAttr()];
    filter[key] = this.getSelectedVerticalAttr();
    // const filterKeys = Object.keys(filterObject);
    // filterKeys.forEach((element) => {
    //   filter[element] = filterObject[element];
    // });
    return filter;
}

  updateDimensionInRequestBody(dimension, value) {
    let newRequestBody;
    if (dimension === 'location') {
      newRequestBody = this.getRequestBody();
      newRequestBody[0].dimension = value;
      newRequestBody[1].dimension = ['topic_name', value];
    } else if (dimension === 'Time Period') {
      newRequestBody = this.getRequestBody();
      newRequestBody[0].granularity = value;
      newRequestBody[0].dimension = [];
      newRequestBody[1].granularity = value;
      newRequestBody[1].dimension = ['topic_name'];
    }
    this.requestBody = newRequestBody;
    console.log('newRequestBody ::::: ', newRequestBody);
    // return this.collectReportData(dimension, value);
  }

  setViewBy(data) {
    this.viewByData = data;
    this.updateDimensionInRequestBody(data.key, data.value);
  }

  getViewBy() {
    if (Object.keys(this.viewByData).length < 1) {
      this.viewByData = {key: 'Time Period', value: 'month'};
    }
    return {...this.viewByData};
  }


  getRequestBody() {
    return [...this.requestBody];
  }

  getChartData(requestBody) {
    console.log(requestBody);
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post('/api/v1/chart/data/read', {request: requestBody}, httpOptions);
  }
}
