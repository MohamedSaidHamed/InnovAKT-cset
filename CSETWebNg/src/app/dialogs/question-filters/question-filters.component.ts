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
import { Component, Inject, Output, EventEmitter, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssessmentService } from '../../services/assessment.service';
import { ConfigService } from '../../services/config.service';
import { QuestionFilterService } from '../../services/filtering/question-filter.service';
import { QuestionsService } from '../../services/questions.service';

@Component({
  selector: 'app-question-filters',
  templateUrl: './question-filters.component.html',
  // eslint-disable-next-line
  host: { class: 'd-flex flex-column flex-11a' },
  standalone: false
})
export class QuestionFiltersComponent implements OnInit {

  showFilterAboveTargetLevel = false;

  @Output() filterChanged = new EventEmitter<any>();


  /**
   * Holds the word "questions" or "statements"
   */
  skin = "core";
  observations = "observations";
  comments = "comments";
  answerOptions: any[];

  constructor(
    public filterSvc: QuestionFilterService,
    private dialog: MatDialogRef<QuestionFiltersComponent>,
    private assessSvc: AssessmentService,
    private configSvc: ConfigService,
    public questionsSvc: QuestionsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (!!data && !!data.showFilterAboveTargetLevel) {
      this.showFilterAboveTargetLevel = data.showFilterAboveTargetLevel
    }

    // close the dialog if enter is pressed when focus is on background
    dialog.keydownEvents().subscribe(e => {
      if ((<KeyboardEvent>e).keyCode === 13) {
        this.close();
      }
    });
  }

  /**
   *
   */
  ngOnInit(): any {
    this.refreshAnswerOptions();
  }

  /**
   *
   */
  refreshAnswerOptions() {
    this.answerOptions = [];
    this.filterSvc.answerOptions.filter(x => x != 'U').forEach(o => {
      this.answerOptions.push({
        value: o,
        text: this.questionsSvc.answerDisplayLabel(this.filterSvc.maturityModelName, o)
      });
    });
  }

  /**
   *
   */
  getId(option: any): string {
    return 'cbShowOption' + option.value;
  }

  /**
   *
   * @param e
   */
  updateFilterString(e: Event) {
    if ((<KeyboardEvent>e).keyCode === 13) {
      this.close();
    }

    const s = (<HTMLInputElement>e.target).value.trim();
    this.filterSvc.filterSearchString = s;

    this.filterChanged.emit(true);
  }

  /**
   * Turns a filter on or off, depending on the state of the checkbox.
   * @param e
   * @param ans
   */
  updateFilters(e: Event, ans: string) {
    this.filterSvc.setFilter(ans, (<HTMLInputElement>e.target).checked);

    this.filterChanged.emit(true);
  }

  /**
   *
   */
  close() {
    return this.dialog.close();
  }

  /**
   *
   */
  isInstallation(mode: string) {
    return this.configSvc.installationMode == mode;
  }

  usesMaturityModel(model: string) {
    return this.assessSvc.usesMaturityModel(model);
  }
  public get maturityLevels(): string[] {
    const maturityModel=this.assessSvc.assessment?.maturityModel;
    if (!this.filterSvc?.allowableFilters || !maturityModel?.levels || maturityModel.levels.length<=1 ) {
      return [];
    }
    const levels = this.filterSvc.allowableFilters
      .filter(f => !isNaN(Number(f))) // Only numeric values
      .map(f => Number(f)) // Convert to numbers for comparison
      .filter(level => level <= (this.filterSvc.maturityTargetLevel || 999)) // Only levels <= target
      .map(level => level.toString()) // Convert back to strings
      .sort((a, b) => Number(a) - Number(b)); // Sort numerically
    return levels;
  }
  public getMaturityLevelLabel(levelNumber: string | number): string
  {
    const maturityModel =this.assessSvc.assessment?.maturityModel;
    if (!maturityModel?.levels) { return `Level ${levelNumber}`; }
    const level =maturityModel.levels.find(l => l.level.toString() === levelNumber.toString());
    return level?.label || `Level ${levelNumber}`; }
}
