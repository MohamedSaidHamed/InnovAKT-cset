//////////////////////////////// 
// 
//   Copyright 2025 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 
using CSETWebCore.Interfaces.FileRepository;
using CSETWebCore.Interfaces.Helpers;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace CSETWebCore.Api.Controllers
{
    [ApiController]
    public class FileDownloadController : ControllerBase
    {
        private readonly IFileRepository _fileRepo;
        private readonly ITokenManager _token;

        public FileDownloadController(IFileRepository fileRepo, ITokenManager token)
        {
            _fileRepo = fileRepo;
            _token = token;
        }


        [HttpGet]
        [Route("api/files/download/{id}")]
        public IActionResult Download(int id)
        {
            var assessmentId = _token.AssessmentForUser();
            var file = _fileRepo.GetFileDescription(id);
            var stream = new MemoryStream(file.Data);

            return File(stream, file.ContentType, file.Name);
        }
    }
}
