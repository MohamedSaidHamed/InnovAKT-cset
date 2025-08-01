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
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AssessmentContactsResponse,
  AssessmentDetail,
  MaturityModel
} from '../models/assessment-info.model';
import { User } from '../models/user.model';
import { ConfigService } from './config.service';
import { Router } from '@angular/router';
import { DemographicExtendedService } from './demographic-extended.service';
import { Answer } from '../models/questions.model';
import { BehaviorSubject, first, firstValueFrom, Observable } from 'rxjs';
import { ConversionService } from './conversion.service';
import { ConstantsService } from './constants.service';

export interface Role {
  assessmentRoleId: number;
  assessmentRole: string;
}

const headers = {
  headers: new HttpHeaders().set('Content-Type', 'application/json'),
  params: new HttpParams()
};

@Injectable()
export class AssessmentService {

  userRoleId: number;
  roles: Role[];
  currentTab: string;
  private apiUrl: string;
  private initialized = false;
  public applicationMode: string;
  public assessmentStateChanged$ = new BehaviorSubject(this.c.NAV_APPLY_CIE_TO_CSTATES);

  /**
   * This is private because we need a setter so that we can do things
   * when the assessment is loaded.
   */
  public assessment: AssessmentDetail;

  /**
   * Stores the active assessment 'features' that the user wishes to use,
   * e.g., diagram, standards, maturity model.
   */
  public assessmentFeatures: any[] = [];

  static allMaturityModels: MaturityModel[];

  /**
   * Indicates if a brand-new assessment is being created.
   * This will allow the assessment-detail page to do certain
   * things that should only be done on the very first load of an assessment.
   */
  public isBrandNew = false;

  public assessmentCreator: any;

  //Hide upgrade assessment alert
  public hideUpgradeAlert: boolean = false;

  //Assessment upgrade conversion galleryItemGuid and target model name
  public galleryItemGuid: string = "";
  public convertToModel: string = "";

  /**
   *
   */
  constructor(
    private http: HttpClient,
    private configSvc: ConfigService,
    private router: Router,
    private extDemoSvc: DemographicExtendedService,
    private c: ConstantsService,
    private convSvc: ConversionService
  ) {
    if (!this.initialized) {
      this.apiUrl = this.configSvc.apiUrl;

      this.http.get(this.apiUrl + 'contacts/allroles')
        .subscribe((response: Role[]) => (this.roles = response));

      this.http.get(this.apiUrl + "MaturityModels")
        .subscribe((data: MaturityModel[]) => {
          AssessmentService.allMaturityModels = data;
        });

      this.initialized = true;
    }
  }

  /**
   *
   */
  dropAssessment() {
    this.userRoleId = undefined;
    this.currentTab = undefined;
    this.applicationMode = undefined;
    this.assessment = undefined;
    localStorage.removeItem('assessmentId');
  }
  /**
   *
   */
  getAllMaturityModels(): Observable<MaturityModel[]> {
    return this.http.get<MaturityModel[]>(`${this.apiUrl}MaturityModels`);
  }
  /**
   *
   */
  refreshRoles() {
    return this.http.get(this.apiUrl + 'contacts/allroles');
  }

  clearFirstTime() {
    this.http.get(this.apiUrl + 'clearFirstTime').subscribe(
      () => {
        console.log("cleared first Time");
      }
    );
  }

  /**
   * If a custom set name is found on the gallery item, include it in the query string.
   * Custom set gallery items are built on the fly and don't have a gallery ID.
   */
  createNewAssessmentFromGallery(workflow: string, galleryItem: any) {
    let queryString: string = 'workflow=' + workflow + '&galleryGuid=' + galleryItem.gallery_Item_Guid;
    if (!!galleryItem.custom_Set_Name) {
      queryString += '&csn=' + galleryItem.custom_Set_Name
    }

    return this.http.get(this.apiUrl + 'createassessment/gallery?' + queryString, headers)
  }

  /**
   *
   */
  getAssessments() {
    return this.http.get(this.apiUrl + 'assessmentsforuser');
  }

  getAssessmentsCompletion() {
    return this.http.get(this.apiUrl + 'assessmentsCompletionForUser');
  }

  /**
   * Get a new token that carries the assessmentID as a claim.  This token
   * should be used for all assessment-specific requests.
   */
  getAssessmentToken(assessId: number) {
    const headers = new HttpHeaders({
      'AssessmentId': assessId
    });
    const obs: Observable<object> = this.http.get(this.apiUrl + 'auth/token', { headers: headers });
    const prom: Promise<object> = firstValueFrom(obs);

    return prom.then((response: { token: string }) => {
      localStorage.removeItem('userToken');
      localStorage.setItem('userToken', response.token);
      if (assessId) {
        localStorage.removeItem('assessmentId');
        localStorage.setItem(
          'assessmentId',
          assessId ? assessId.toString() : ''
        );
      }
    });
  }

  /**
   *
   */
  getAssessmentDetail() {
    return this.http.get(this.apiUrl + 'assessmentdetail');
  }

  /**
   * Returns an observable that calls the API to get the last modified date
   * for the assessment.
   * @returns
   */
  getLastModified() {
    return this.http.get(this.apiUrl + 'lastmodified', { responseType: 'json' });
  }

  moveActionItemsFrom_IseActions_To_HydroData() {
    return this.http.get(this.apiUrl + 'moveHydroActionsOutOfIseActions');
  }

  /**
   *
   */
  updateAssessmentDetails(assessment: AssessmentDetail) {
    this.assessment = assessment;

    // clean out properties that may contain HTML before posting.
    // The API WAF may reject to prevent XSS.
    // These properties are not user updatable.
    const payload = JSON.parse(JSON.stringify(assessment));
    payload.maturityModel = null;
    payload.typeDescription = null;

    return this.http
      .post(
        this.apiUrl + 'assessmentdetail',
        JSON.stringify(payload),
        headers
      )
      .subscribe(() => {
        if (this.configSvc.userIsCisaAssessor) {
          this.updateAssessmentName();
        }
      });
  }

  /**
   *
   */
  getAssessmentContacts() {
    const obs = this.http.get(this.apiUrl + 'contacts');
    const prom = firstValueFrom(obs);

    return prom.then((response: AssessmentContactsResponse) => {
      this.userRoleId = response.currentUserRole;
      return response;
    });
  }

  getCreator() {
    const obs = this.http.get(this.apiUrl + 'assessmentcreator');
    const prom = firstValueFrom(obs);

    return prom.then((response: any) => {
      this.assessmentCreator = response;
      return response;
    });
  }

  /**
   *
   */
  getAssessmentContactsById(ids: number[]) {
    var id1 = (ids[0] != undefined ? ids[0] : 0);
    var id2 = (ids[1] != undefined ? ids[1] : 0);
    var id3 = (ids[2] != undefined ? ids[2] : 0);
    var id4 = (ids[3] != undefined ? ids[3] : 0);
    var id5 = (ids[4] != undefined ? ids[4] : 0);
    var id6 = (ids[5] != undefined ? ids[5] : 0);
    var id7 = (ids[6] != undefined ? ids[6] : 0);
    var id8 = (ids[7] != undefined ? ids[7] : 0);
    var id9 = (ids[8] != undefined ? ids[8] : 0);
    var id10 = (ids[9] != undefined ? ids[9] : 0);

    headers.params = headers.params.set('id1', id1).set('id2', id2).set('id3', id3).set('id4', id4)
      .set('id5', id5).set('id6', id6).set('id7', id7).set('id8', id8).set('id9', id9).set('id10', id10);

    return this.http.get(this.apiUrl + 'contactsById', headers);
  }

  /**
   *
   */
  getOrganizationTypes() {
    return this.http.get(this.apiUrl + 'getOrganizationTypes');
  }

  /**
   *
   */
  getOtherRemarks() {
    return this.http.get(this.apiUrl + 'remarks', { responseType: 'text' });
  }

  /**
   *
   */
  saveOtherRemarks(remarks: string) {
    return this.http.post(this.apiUrl + 'remarks', JSON.stringify(remarks), headers);
  }

  /**
   *
   */
  searchContacts(term: User) {
    return this.http.post(
      this.apiUrl + 'contacts/search',
      JSON.stringify(term),
      headers
    );
  }

  /**
   *
   */
  createContact(contact: User) {
    const body = this.configSvc.config.defaultInviteTemplate;
    return this.http.post(this.apiUrl + 'contacts/addnew', {
      firstName: contact.firstName,
      lastName: contact.lastName,
      primaryEmail: contact.primaryEmail,
      title: contact.title,
      phone: contact.phone,
      cellPhone: contact.cellPhone,
      reportsTo: contact.reportsTo,
      organizationName: contact.organizationName,
      siteName: contact.siteName,
      emergencyCommunicationsProtocol: contact.emergencyCommunicationsProtocol,
      isSiteParticipant: contact.isSiteParticipant,
      isPrimaryPoc: contact.isPrimaryPoc,
      assessmentRoleId: contact.assessmentRoleId,
      subject: this.configSvc.config.defaultInviteSubject,
      body: body
    },
      headers
    );
  }

  createMergeContact(contact: User) {
    const body = this.configSvc.config.defaultInviteTemplate;
    return this.http.post(this.apiUrl + 'contacts/addnewmergecontact', {
      firstName: contact.firstName,
      lastName: contact.lastName,
      primaryEmail: contact.primaryEmail,
      title: contact.title,
      phone: contact.phone,
      cellPhone: contact.cellPhone,
      reportsTo: contact.reportsTo,
      organizationName: contact.organizationName,
      siteName: contact.siteName,
      emergencyCommunicationsProtocol: contact.emergencyCommunicationsProtocol,
      isSiteParticipant: contact.isSiteParticipant,
      isPrimaryPoc: contact.isPrimaryPoc,
      assessmentRoleId: contact.assessmentRoleId,
      subject: this.configSvc.config.defaultInviteSubject,
      body: body
    },
      headers
    );
  }

  /**
   *
   */
  updateContact(contact: User): any {
    return this.http.post(
      this.apiUrl + 'contacts/UpdateUser',
      contact,
      headers
    );
  }

  /**
   *
   */
  addContact(contact: User) {
    return this.http.post(
      this.apiUrl + 'contacts/add',
      {
        primaryEmail: contact.primaryEmail,
        assessmentRoleId: contact.assessmentRoleId
      },
      headers
    );
  }

  /**
   * Disconnects the current user from an assessment.
   */
  removeMyContact(assessment_id: number) {
    return this.http.post(
      this.apiUrl + 'contacts/remove',
      { assessmentId: assessment_id },
      headers
    );
  }

  /**
   * Requests removing a user from an assessment.
   */
  removeContact(assessmentContactId: number): Observable<object> {
    return this.http.post(
      this.apiUrl + 'contacts/remove',
      { assessmentContactId: assessmentContactId },
      headers
    );
  }

  /**
   * Checks to see if deleting the assessment would leave it without
   * an ADMIN contact
   */
  isDeletePermitted() {
    return this.http.post(
      this.apiUrl + 'contacts/validateremoval',
      null,
      headers
    );
  }

  /**
   *
   */
  id(): number {
    return +localStorage.getItem('assessmentId');
  }

  /**
   *
   */
  getMode() {
    this.http
      .get(this.apiUrl + 'GetMode', { responseType: 'text' })
      .subscribe((mode: string) => (this.applicationMode = mode));
  }


  newAssessmentGallery(galleryItem: any): Promise<any> {
    let workflow = 'BASE';
    switch (this.configSvc.installationMode || '') {
      default:
        workflow = 'BASE';
    }

    return new Promise((resolve, reject) => {
      const obs = this.createNewAssessmentFromGallery(workflow, galleryItem);
      const prom = firstValueFrom(obs);
      prom.then(
        (response: any) => {
          // set the brand new flag
          this.isBrandNew = true;
          this.loadAssessment(response.id).then(() => {
            resolve(response.id);
          });
        },
        error =>
          console.log(
            'Unable to create new assessment: ' + (<Error>error).message
          )
      );
    });
  }


  //Call this when the assessment name
  //was calculated in the backend and needs
  //to be updated here
  updateAssessmentName() {
    this.getAssessmentDetail().subscribe((data: AssessmentDetail) => {
      this.assessment.assessmentName = data.assessmentName;
    });
  }

  refreshAssessment() {
    this.getAssessmentDetail().subscribe((detail: AssessmentDetail) => {
      this.assessment = detail
    })
  }

  /**
   * Requests the assessment detail from the API
   * and resolves the promise so that navigation
   * can take place in the function that called
   * this one.
   */
  loadAssessment(id: number): Promise<any> {
    this.hideUpgradeAlert = false;
    return new Promise((resolve, reject) => {
      this.getAssessmentToken(id).then(() => {
        this.getAssessmentDetail().subscribe((data: AssessmentDetail) => {
          this.assessment = data;

          this.applicationMode = this.assessment.applicationMode;

          if (this.assessment.baselineAssessmentId) {
            localStorage.setItem("baseline", this.assessment.baselineAssessmentId.toString());
          } else {
            localStorage.setItem("baseline", "0");
          }

          // make sure that the acet only switch is turned off when in standard CSET
          this.extDemoSvc.preloadDemoAndGeo();
          const rpath = localStorage.getItem('returnPath');

          // normal assessment load
          if (!rpath) {
            resolve('assessment loaded');
            return;
          }

          // return path specified
          localStorage.removeItem('returnPath');
          const returnPath = `/assessment/${id}/${rpath}`;
          this.router.navigate([returnPath], { queryParamsHandling: 'preserve' });
          resolve(returnPath);
        });
      });
    });
  }

  /**
   *
   */
  getAssessmentDocuments() {
    return this.http.get(this.apiUrl + 'assessmentdocuments');
  }

  /**
   * Possibly deprecated.  The Diagram page can determine if there
   * is a diagram by looking at the components returned from the
   * getCompleteDiagram endpoint.
   */
  hasDiagram() {
    return this.http.get(this.apiUrl + 'diagram/has');
  }

  /**
   * Returns a boolean indicating if the feature is active.
   * @param feature
   */
  hasFeature(feature: string) {
    return this.assessmentFeatures.indexOf(feature.toLowerCase()) >= 0;
  }

  /**
   * Adds or removes an assessment feature from the list.
   */
  changeFeature(feature: string, state: boolean) {
    if (state) {
      if (this.assessmentFeatures.indexOf(feature) < 0) {
        this.assessmentFeatures.push(feature);
      }
    } else {
      this.assessmentFeatures = this.assessmentFeatures.filter(x => x !== feature);
    }
  }

  /**
   * Indicates if the assessment uses the specified maturity model name.
   */
  usesMaturityModel(modelName: string) {
    if (!this.assessment) {
      return false;
    }

    if (!this.assessment.useMaturity) {
      return false;
    }

    if (!this.assessment.maturityModel) {
      return false;
    }

    if (!this.assessment.maturityModel.modelName) {
      return false;
    }

    if (modelName == '*' && !!this.assessment.maturityModel.modelName) {
      return true;
    }

    return this.assessment.maturityModel.modelName.toLowerCase() === modelName.toLowerCase();
  }

  /**
   * Indicates if the assessment uses the maturity model for the specified ID
   */
  usesMaturityModelId(modelId: number) {
    return this.assessment?.useMaturity && modelId == this.assessment?.maturityModel?.modelId;
  }

  /**
   * Sets the maturity model name on the local assessment model.
   * @param modelName
   */
  setModel(modelName: string) {
    this.assessment.maturityModel = AssessmentService.allMaturityModels.find(m => m.modelName.toUpperCase() == modelName.toUpperCase());
  }

  /**
   * Indicates if the assessment contains the standard.
   */
  usesStandard(setName: string) {
    if (!this.assessment || !this.assessment.standards) {
      return false;
    }
    return this.assessment?.standards.some(s => s.toLowerCase() == setName.toLowerCase());
  }

  /**
   * Converts linebreak characters to HTML <br> tag.
   */
  formatLinebreaks(text: string) {
    if (!text) {
      return '';
    }
    return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
  }

  /**
   * Indicates if the assessment is PCII.  This is set in the
   * CISA Assessor Workflow's Assessment Configuration page.
   */
  isPcii() {
    if (!!this.assessment) {
      return this.assessment.is_PCII ?? false;
    }
    return false;
  }

  /**
  * Saves the user's "Prevent Encrypt" toggle option to the database.
  * @param status
  */
  persistEncryptPreference(status: boolean) {
    return this.http.post(this.apiUrl + 'saveEncryptStatus', status, headers);
  }

  /**
  * Gets the user's "Prevent Encrypt" toggle option from the database.
  */
  getEncryptPreference() {
    return this.http.get(this.apiUrl + 'encryptStatus');
  }

  hasGlobalDocuments(){
    return this.http.get(this.apiUrl+ 'hasGlobalDocuments');
  }


  updateAnswer(answer: Answer) {

  }

  //Assessment upgrade conversion
  convertAssesment(original_id: number) {
    let queryParams = new HttpParams()
      .set('originalAssessmentId', original_id)
      .set('targetModelName', this.convertToModel)

    return this.http.post(
      this.apiUrl + 'conversion', null, { params: queryParams }
    );
  }

  //Check if assessment has an upgrade available
  checkUpgrades() {
    return this.http.get(this.apiUrl + 'upgrades');
  }

  setAssessorSetting(mode: boolean) {
    this.assessment.assessorMode = mode;
    return this.http.post(this.apiUrl + 'assessormode', mode, headers)
  }

}
