import PDFMerger from 'pdf-merger-js/browser';
import React, { useEffect, useState } from 'react';

// files: Array of PDF File or Blob objects
const Merger = ({files}) => {
  const [mergedPdfUrl, setMergedPdfUrl] = useState();

  useEffect(() => {
    const render = async () => {
      const merger = new PDFMerger();

      for(const file of files) {
        await merger.add(file)
      }

      const mergedPdf = await merger.saveAsBlob();
      const url = URL.createObjectURL(mergedPdf);

      return setMergedPdfUrl(url);
    };

    render().catch((err) => {
      throw err;
    });
    
  }, [files, setMergedPdfUrl]);

  return !mergedPdfUrl ? (
    <>Loading</>
  ) : (
    <iframe
      height={1000}
      src={`${mergedPdfUrl}`}
      title='pdf-viewer'
      width='100%s'
    ></iframe>
  );
};

export default Merger;