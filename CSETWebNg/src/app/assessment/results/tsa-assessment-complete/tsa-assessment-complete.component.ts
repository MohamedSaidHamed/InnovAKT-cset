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
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AssessmentService } from '../../../services/assessment.service';
import { NavigationService } from '../../../services/navigation/navigation.service';

@Component({
    selector: 'app-tsa-assessment-complete',
    templateUrl: './tsa-assessment-complete.component.html',
    standalone: false
})
export class TsaAssessmentCompleteComponent implements OnInit {

  constructor(
    private assessSvc: AssessmentService,
    public navSvc: NavigationService,
    public router: Router
  ) { }

  ngOnInit(): void {
  }

  convertToCSET(): void {
    this.assessSvc.assessment.workflow = 'CSET';
    this.assessSvc.updateAssessmentDetails(this.assessSvc.assessment);
    this.router.navigate(['/landing-page']);
  }
}
