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
import { AggregationService } from '../../../../services/aggregation.service';

@Component({
    selector: 'app-compare-missed-maturity',
    templateUrl: './compare-missed.component.html',
    // eslint-disable-next-line
    host: { class: 'd-flex flex-column flex-11a' },
    standalone: false
})
export class CompareMaturityMissedComponent implements OnInit {

  missedQuestions: [] = null;

  /**
   * 
   */
  constructor(
    public aggregationSvc: AggregationService
  ) { }

  /**
   * 
   */
  ngOnInit() {
    this.aggregationSvc.getMaturityMissedQuestions().subscribe((resp: any) => {
      this.missedQuestions = resp.missedQuestions;

      // determine the appropriate text to be displayed for the questions
      this.missedQuestions.forEach((q: any) => {
        q.displayText = q.questionText;

        if (!!q.securityPractice) {
          q.displayText = q.securityPractice;
        }
      });
    });
  }
}
