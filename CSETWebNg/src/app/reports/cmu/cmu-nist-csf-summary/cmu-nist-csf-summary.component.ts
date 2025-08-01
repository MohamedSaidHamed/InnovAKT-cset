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
import { CmuService } from '../../../services/cmu.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-cmu-nist-csf-summary',
    templateUrl: './cmu-nist-csf-summary.component.html',
    styleUrls: ['./cmu-nist-csf-summary.component.scss'],
    standalone: false
})
export class CmuNistCsfSummaryComponent implements OnInit {
  model: any;

  chartAll: string = '';
  legend: string = '';
  csfData: any;

  constructor(private cmuSvc: CmuService) { }

  ngOnInit(): void {
    this.cmuSvc.getCsf().subscribe((resp: any) => {
      this.model = resp;
      this.csfData = resp;
    });

    this.cmuSvc.getNistCsfSummaryChartWidget().subscribe((resp: string) => {
      this.chartAll = resp;
    });

    this.cmuSvc.getMil1PerformanceSummaryLegendWidget('1').subscribe((resp: string) => {
      this.legend = resp;
    });
  }
}
