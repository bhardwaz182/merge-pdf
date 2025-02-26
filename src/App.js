import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";

function DraggableFile({ file, index, moveFile, removeFile }) {
  const [, ref] = useDrag({
    type: "file",
    item: { index },
  });

  const [, drop] = useDrop({
    accept: "file",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveFile(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => ref(drop(node))} className="file-item">
      <span>{file.name}</span>
      <button className="delete-btn" onClick={() => removeFile(index)}>X</button>
    </div>
  );
}

function App() {
  const [files, setFiles] = useState([]);
  const [mergedFile, setMergedFile] = useState(null);

  const handleFileUpload = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const mergeFiles = async () => {
    let doc = await PDFDocument.create();
    for (const file of files) {
      let pdf = await PDFDocument.load(await readFileAsync(file));
      const copiedPages = await doc.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => doc.addPage(page));
    }
    setMergedFile(await doc.save());
  };

  const downloadMerged = () => {
    if (mergedFile) {
      const blob = new Blob([mergedFile], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "MergedPdf.pdf";
      link.click();
    }
  };

  const moveFile = (fromIndex, toIndex) => {
    const updatedFiles = [...files];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    updatedFiles.splice(toIndex, 0, movedFile);
    setFiles(updatedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <div className="container">
          <div className="drop-zone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            Drag & Drop PDFs Here or
            <input type="file" multiple onChange={handleFileUpload} className="file-input" />
          </div>
          <div className="file-list">
            {files.map((file, index) => (
              <DraggableFile key={index} file={file} index={index} moveFile={moveFile} removeFile={removeFile} />
            ))}
          </div>
          <button onClick={mergeFiles} className="btn">Merge PDFs</button>
          <button onClick={downloadMerged} className="btn" disabled={!mergedFile}>
            Download Merged PDF
          </button>
        </div>
      </DndProvider>
      {mergedFile && (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.14.305/build/pdf.worker.min.js">
          <Viewer fileUrl={URL.createObjectURL(new Blob([mergedFile], { type: "application/pdf" }))} plugins={[defaultLayoutPlugin]}/>
        </Worker>
      )}
    </div>
  );
}

export default App;
