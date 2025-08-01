//////////////////////////////// 
// 
//   Copyright 2025 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 

using System;

namespace CSETWebCore.Model.Document
{
    public class Document
    {
        /// <summary>
        /// 
        /// </summary>
        public int Document_Id { get; set; }

        /// <summary>
        /// 
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// 
        /// </summary>
        public string FileName { get; set; }

        public Boolean IsGlobal { get; set; }
    }
}