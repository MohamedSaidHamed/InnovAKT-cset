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
import { Component, ViewEncapsulation, isDevMode } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AggregationService } from '../../services/aggregation.service';
import { AssessmentService } from '../../services/assessment.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SetBuilderService } from '../../services/set-builder.service';
import { ConfigService } from '../../services/config.service';
import { FileUploadClientService } from '../../services/file-client.service';
import { OnlineDisclaimerComponent } from '../../dialogs/online-disclaimer/online-disclaimer.component';
import { LayoutService } from '../../services/layout.service';


@Component({
    selector: 'iod-layout',
    templateUrl: './iod-layout.component.html',
    styleUrls: ['./iod-layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    // eslint-disable-next-line
    host: { class: 'd-flex flex-column flex-11a w-100 h-100' },
    standalone: false
})
export class IodLayoutComponent {
  docUrl: string;
  dialogRef: MatDialogRef<any>;
  isFooterVisible: boolean = false;
  footerClosed: boolean = true;
  devMode: boolean = isDevMode();

  constructor(
    public auth: AuthenticationService,
    public assessSvc: AssessmentService,
    public configSvc: ConfigService,
    public layoutSvc: LayoutService,
    public aggregationSvc: AggregationService,
    public fileSvc: FileUploadClientService,
    public setBuilderSvc: SetBuilderService,
    public dialog: MatDialog,
    public router: Router
  ) { }

  /**
   * Indicates if the user is currently within the Module Builder pages.
   */
  isModuleBuilder(rpath: string) {
    if (!rpath) {
      return false;
    }

    rpath = rpath.split('/')[1];
    return this.setBuilderSvc.moduleBuilderPaths.includes(rpath);
  }

  goHome() {
    this.assessSvc.dropAssessment();
    this.router.navigate(['/home']);
  }

  toggleFooter() {
    this.footerClosed = !this.footerClosed;
  }

  isRunningAnonymous() {
    return this.configSvc.isRunningAnonymous;
  }

  showDisclaimer() {
    this.dialog.open(OnlineDisclaimerComponent, { data: { publicDomainName: this.configSvc.publicDomainName } });
  }
}
