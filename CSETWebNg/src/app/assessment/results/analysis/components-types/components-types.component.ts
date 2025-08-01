////////////////////////////////
//
//   Copyright 2025 Battelle Energy Alliance, LLC
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
//
////////////////////////////////
import { Component, OnInit } from '@angular/core';
import { AnalysisService } from '../../../../services/analysis.service';
import { ConfigService } from '../../../../services/config.service';
import { NavigationService } from '../../../../services/navigation/navigation.service';
import Chart from 'chart.js/auto';
import { QuestionsService } from '../../../../services/questions.service';

@Component({
    selector: 'app-components-types',
    templateUrl: './components-types.component.html',
    standalone: false
})
export class ComponentsTypesComponent implements OnInit {
  chart: Chart;
  dataRows: { title: string; yes: number; no: number; na: number; alt: number; unanswered: number; total: number; }[];
  initialized = false;
  dataSet: any;

  constructor(
    private analysisSvc: AnalysisService,
    //private assessSvc: AssessmentService,
    public questionsSvc: QuestionsService,
    public navSvc: NavigationService,
    public configSvc: ConfigService,
    //private router: Router
  ) { }

  ngOnInit() {
    this.analysisSvc.getComponentTypes().subscribe(x => {
      this.analysisSvc.buildComponentTypes('canvasComponentTypes', x);
      this.dataRows = x.dataRows;
      this.initialized = true;
      this.dataSet = x.dataRows.length
    });


  }
}
