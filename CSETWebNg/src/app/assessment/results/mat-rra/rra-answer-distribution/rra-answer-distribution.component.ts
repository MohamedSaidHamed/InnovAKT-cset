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
import { Component, HostListener, OnInit } from '@angular/core';
import { RraDataService } from '../../../../services/rra-data.service';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-rra-answer-distribution',
    templateUrl: './rra-answer-distribution.component.html',
    styleUrls: ['./rra-answer-distribution.component.scss'],
    standalone: false
})
export class RraAnswerDistributionComponent implements OnInit {
  answerDistribByLevel = [];
  xAxisTicks = [0, 25, 50, 75, 100];
  answerDistribColorScheme = { domain: ['#28A745', '#DC3545', '#c3c3c3'] };
  view: any[] = [800, 350];
  animation: boolean = false;

  constructor(
    public rraDataSvc: RraDataService,
    public tSvc: TranslocoService
  ) { }

  ngOnInit(): void {
    this.rraDataSvc.getRRADetail().subscribe((r: any) => {
      this.createAnswerDistribByLevel(r);
    });
  }

  createAnswerDistribByLevel(r: any) {
    let levelList = [];
    r.rraSummary.forEach(element => {
      let level = levelList.find(x => x.name == element.level_Name);
      if (!level) {
        level = {
          name: element.level_Name, series: [
            { name: 'Yes', value: 0 },
            { name: 'No', value: 0 },
            { name: 'Unanswered', value: 0 },
          ]
        };
        levelList.push(level);
      }

      var p = level.series.find(x => x.name == element.answer_Full_Name);
      p.value = element.percent;
    });

    this.answerDistribByLevel = levelList;

    for (let i of this.answerDistribByLevel) {
      for (let j of i.series) {
        j.name = this.tSvc.translate('answer-options.button-labels.' + j.name.toLowerCase())
      }
    }
    for (let i of this.answerDistribByLevel) {
      i.name = this.tSvc.translate('level.' + i.name.toLowerCase())
    }

  }

  formatPercent(x: any) {
    return x + '%';
  }

  @HostListener('window:beforeprint')
  beforePrint() {
    this.view = [600, 350];
  }

  @HostListener('window:afterprint')
  afterPrint() {
    this.view = null;
  }
}
