﻿//////////////////////////////// 
// 
//   Copyright 2025 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 
using CSETWebCore.Business.AssessmentIO.Models.AutoGenerated;
using CSETWebCore.Business.Diagram;
using CSETWebCore.DataLayer.Model;
using CSETWebCore.Helpers;
using CSETWebCore.Interfaces.Helpers;
using CSETWebCore.Model.AssessmentIO;
using CSETWebCore.Model.Diagram;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;
using ICSharpCode.SharpZipLib.Zip;

namespace CSETWebCore.Business.AssessmentIO.Import
{
    public class ImportManager : IImportManager
    {
        private ITokenManager _token;
        private IAssessmentUtil _assessmentUtil;
        private IUtilities _utilities;
        private CSETContext _context;


        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        public ImportManager(ITokenManager token, IAssessmentUtil assessmentUtil, IUtilities utilities, CSETContext context)
        {
            _token = token;
            _assessmentUtil = assessmentUtil;
            _utilities = utilities;
            _context = context;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="zipFileFromDatabase"></param>
        /// <param name="currentUserId"></param>
        /// <returns></returns>
        public async Task ProcessCSETAssessmentImport(byte[] zipFileFromDatabase, int? currentUserId, string accessKey, CSETContext context, string password = "", bool overwriteAssessment = false)
        {
            //* read from db and set as memory stream here.
            using (Stream fs = new MemoryStream(zipFileFromDatabase))
            {
                MemoryStream ms = new MemoryStream();

                var x = new ZipFile(fs);
                ZipEntry e = x.GetEntry("model.json");



                if (!String.IsNullOrEmpty(password))
                {
                    x.Password = password;
                }

                using (var zipStream = x.GetInputStream(e))
                {
                    zipStream.CopyTo(ms);
                }


                ms.Position = 0;
                StreamReader sr = new StreamReader(ms);
                string jsonObject = sr.ReadToEnd();

                // Apply any data updates to older versions
                ImportUpgradeManager upgrader = new ImportUpgradeManager();
                jsonObject = upgrader.Upgrade(jsonObject);


                try
                {
                    UploadAssessmentModel model = (UploadAssessmentModel)JsonConvert.DeserializeObject(jsonObject, new UploadAssessmentModel().GetType());

                    foreach (var doc in model.CustomStandardDocs)
                    {
                        var genFile = context.GEN_FILE.FirstOrDefault(s => s.File_Name == doc);
                        if (genFile == null)
                        {
                            //StreamReader docReader = new StreamReader(zip.GetEntry(doc + ".json").Open());
                            StreamReader docReader = new StreamReader(ms);
                            var docModel = JsonConvert.DeserializeObject<ExternalDocument>(docReader.ReadToEnd());
                            genFile = ReferenceConverter.ToGenFile(docModel);
                            var extension = Path.GetExtension(genFile.File_Name).Substring(1);
                            genFile.File_Type = context.FILE_TYPE.Where(s => s.File_Type1 == extension).FirstOrDefault();

                            try
                            {
                                context.FILE_REF_KEYS.Add(new FILE_REF_KEYS { Doc_Num = genFile.Doc_Num });
                                await context.SaveChangesAsync();
                            }
                            catch (Exception exc)
                            {
                                NLog.LogManager.GetCurrentClassLogger().Error($"... {exc}");

                                throw;
                            }

                            context.GEN_FILE.Add(genFile);
                            context.SaveChanges();
                        }
                    }

                    foreach (var standard in model.CustomStandards)
                    {
                        var sets = context.SETS.Where(s => s.Short_Name.Contains(standard)).ToList();
                        if (sets.Count == 0)
                        {
                            throw new Exception("Custom module not found");
                        }
                        SETS set = null;
                        //StreamReader setReader = new StreamReader(zip.GetEntry(standard + ".json").Open());
                        ms.Position = 0;
                        StreamReader setReader = new StreamReader(ms);
                        var setJson = setReader.ReadToEnd();
                        var setModel = JsonConvert.DeserializeObject<ExternalStandard>(setJson);
                        var originalSetName = standard;
                        foreach (var testSet in sets)
                        {
                            originalSetName = testSet.Short_Name;
                            var testSetJson = JsonConvert.SerializeObject(testSet.ToExternalStandard(_context), Newtonsoft.Json.Formatting.Indented);
                            if (testSetJson == setJson)
                            {
                                set = testSet;
                                break;
                            }
                            else
                            {
                                setModel.name = originalSetName;
                            }
                        }

                        if (set == null)
                        {
                            var setResult = await setModel.ToSet(_context);
                            if (setResult.IsSuccess)
                            {
                                context.SETS.Add(setResult.Result);

                                foreach (var question in setResult.Result.NEW_REQUIREMENT.SelectMany(s => s.NEW_QUESTIONs(_context)).Where(s => s.Question_Id != 0).ToList())
                                {
                                    context.Entry(question).State = EntityState.Unchanged;
                                }
                                try
                                {
                                    await context.SaveChangesAsync();
                                }
                                catch (Exception exc)
                                {
                                    NLog.LogManager.GetCurrentClassLogger().Error($"... {exc}");

                                    throw;
                                }

                                //Set the GUID at time of export so we are sure it's right!!!                                
                                model.jANSWER = model.jANSWER.Where(s => s.Is_Requirement ?? false).GroupJoin(setResult.Result.NEW_REQUIREMENT, s => s.Custom_Question_Guid, req => new Guid(MD5.Create().ComputeHash(Encoding.Default.GetBytes(originalSetName + "|||" + req.Requirement_Title + "|||" + req.Requirement_Text))).ToString(), (erea, s) =>
                                {
                                    var req = s.FirstOrDefault();
                                    if (req != null)
                                    {
                                        erea.Question_Or_Requirement_Id = req.Requirement_Id;
                                    }
                                    return erea;
                                }).Concat(model.jANSWER.Where(s => !s.Is_Requirement ?? false).GroupJoin(setResult.Result.NEW_QUESTION, s => s.Custom_Question_Guid, req => new Guid(MD5.Create().ComputeHash(Encoding.Default.GetBytes(req.Simple_Question))).ToString(), (erer, s) =>
                                {
                                    var req = s.FirstOrDefault();
                                    if (req != null)
                                    {
                                        erer.Question_Or_Requirement_Id = req.Question_Id;
                                    }
                                    return erer;
                                })).ToList();
                            }
                        }

                        foreach (var availableStandard in model.jAVAILABLE_STANDARDS.Where(s => s.Set_Name == Regex.Replace(originalSetName, @"\W", "_") && s.Selected))
                        {
                            availableStandard.Set_Name = Regex.Replace(setModel.shortName, @"\W", "_");
                        }
                    }

                    string email = context.USERS.Where(x => x.UserId == currentUserId).FirstOrDefault()?.PrimaryEmail ?? "";


                    Importer import = new Importer(model, currentUserId, email, accessKey, context, _token, _assessmentUtil, _utilities);
                    int newAssessmentId = import.RunImportManualPortion(overwriteAssessment);
                    import.RunImportAutomatic(newAssessmentId, jsonObject, context);

                    // Save the diagram
                    var assessment = context.ASSESSMENTS.Where(x => x.Assessment_Id == newAssessmentId).FirstOrDefault();
                    if (!string.IsNullOrEmpty(assessment.Diagram_Markup))
                    {
                        var diagramManager = new DiagramManager(context);
                        var diagReq = new DiagramRequest()
                        {
                            DiagramXml = assessment.Diagram_Markup,
                            DiagramSvg = assessment.Diagram_Image,
                            AnalyzeDiagram = false,
                            revision = false
                        };
                        var xDocDiagram = new XmlDocument();
                        xDocDiagram.LoadXml(assessment.Diagram_Markup);
                        diagramManager.SaveDiagram(newAssessmentId, xDocDiagram, diagReq, false);
                    }

                    import.Finalize(newAssessmentId);


                    // Clean up any imported standards that are unselected
                    var unselectedStandards = context.AVAILABLE_STANDARDS.Where(x => x.Assessment_Id == newAssessmentId && !x.Selected).ToList();
                    context.AVAILABLE_STANDARDS.RemoveRange(unselectedStandards);
                    context.SaveChanges();


                    //NOTE THAT THIS ENTRY WILL ONLY COME FROM A OLD .cset file 
                    //IMPORT
                    //ZipArchiveEntry importLegacyDiagram = zip.GetEntry("Diagram.csetd");
                    //ZipEntry importLegacyDiagram = zip["Diagram.csetd"];

                    ZipEntry importLegacyDiagram = x.GetEntry("Diagram.csetd");


                    if (importLegacyDiagram != null)
                    {
                        //StreamReader ldr = new StreamReader(importLegacyDiagram.Open());
                        StreamReader ldr = new StreamReader(ms);
                        string oldXml = ldr.ReadToEnd();
                        DiagramManager dm = new DiagramManager(context);
                        dm.ImportOldCSETDFile(oldXml, newAssessmentId);
                    }
                }
                catch (Exception exc)
                {
                    NLog.LogManager.GetCurrentClassLogger().Error($"... {exc}");

                    throw;
                }
            }
        }

        /// <summary>
        /// Imports all assessments from a zip archive. 
        /// Each entry in the top level of the archive should be a .csetw file.
        /// </summary>
        /// <param name="assessmentsZipArchive"></param>
        public async Task BulkImportAssessments(Stream assessmentsZipArchive, bool overwriteAssessments = false)
        {
            using (assessmentsZipArchive)
            {
                // ZipFile zip = ZipFile.Read(assessmentsZipArchive);

                var zip = new ZipFile(assessmentsZipArchive);

                foreach (ZipEntry entry in zip)
                {
                    using (MemoryStream stream = new MemoryStream())
                    {
                        //entry.Extract(stream);

                        using (var zipStream = zip.GetInputStream(entry))
                        {
                            zipStream.CopyTo(stream);
                        }


                        await ProcessCSETAssessmentImport(stream.ToArray(), null, null, _context, overwriteAssessment: overwriteAssessments);
                    }
                }
            }
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="csetFilePath"></param>
        /// <param name="token"></param>
        /// <param name="processPath"></param>
        /// <param name="apiURL"></param>
        /// <returns></returns>
        public void LaunchLegacyCSETProcess(string csetFilePath, string token, string processPath, string apiURL)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("\"" + csetFilePath + "\" ");
            sb.Append(token ?? "test");
            sb.Append(" " + apiURL);
            string varargs = sb.ToString();
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = processPath,
                    Arguments = varargs,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                }
            };
            process.Start();
            process.WaitForExit();// Waits here for the process to exit.
        }
    }
}
