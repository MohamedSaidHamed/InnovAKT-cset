//////////////////////////////// 
// 
//   Copyright 2025 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 
using CSETWebCore.Business.Reports;
using CSETWebCore.DataLayer.Model;
using CSETWebCore.Interfaces.Helpers;
using CSETWebCore.Model.Diagram;
using CSETWebCore.Model.Maturity;
using CSETWebCore.Model.Question;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CSETWebCore.Interfaces.Reports
{
    public interface IReportsDataBusiness
    {
        void SetReportsAssessmentId(int assessmentId);

        void SetToken(ITokenManager token);

        List<MatRelevantAnswers> GetMaturityDeficiencies(int? modelId = null);
        List<MatRelevantAnswers> GetCommentsList(int? modelId = null);
        List<MatRelevantAnswers> GetMarkedForReviewList(int? modelId = null);
        List<MatRelevantAnswers> GetAlternatesList();
        List<MatRelevantAnswers> GetQuestionsList(int? modelId = null);

        string GetCsetVersion();
        string GetAssessmentGuid(int assessmentId);
        List<string> GetDomains();

        void BuildSubGroupings(MaturityGrouping g, int? parentID,
            List<MATURITY_GROUPINGS> allGroupings,
            List<MATURITY_QUESTIONS> questions,
            List<FullAnswer> answers);

        List<BasicReportData.RequirementControl> GetControls(string applicationMode);
        List<List<DiagramZones>> GetDiagramZones();
        List<usp_getFinancialQuestions_Result> GetFinancialQuestions();
        List<StandardQuestions> GetQuestionsForEachStandard();
        List<ComponentQuestion> GetComponentQuestions();
        List<usp_GetOverallRankedCategoriesPage_Result> GetTop5Categories();
        List<RankedQuestions> GetTop5Questions();
        List<QuestionsWithAltJust> GetQuestionsWithAlternateJustification();
        List<QuestionsWithComments> GetQuestionsWithComments();
        List<QuestionsMarkedForReview> GetQuestionsMarkedForReview();
        List<QuestionsMarkedForReview> GetQuestionsReviewed();
        List<RankedQuestions> GetRankedQuestions();
        List<DocumentLibraryEntry> GetDocumentLibrary();
        BasicReportData.OverallSALTable GetNistSals();
        List<BasicReportData.CNSSSALJustificationsTable> GetNistInfoTypes();
        BasicReportData.OverallSALTable GetSals();
        BasicReportData.INFORMATION GetInformation();
        List<Individual> GetObservationIndividuals();
        GenSALTable GetGenSals();
        MaturityReportData.MaturityModel GetBasicMaturityModel();
        List<MaturityReportData.MaturityModel> GetMaturityModelData();
        string FormatName(string firstName, string lastName);

        IEnumerable<CONFIDENTIAL_TYPE> GetConfidentialTypes();
        List<BasicReportData.RequirementControl> GetControlsDiagram(string applicationMode);
        List<PhysicalQuestions> GetQuestionsWithSupplementals();
        Task<List<StandardQuestions>> GetStandardQuestionAnswers(int assessId);
    }
}