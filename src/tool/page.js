import React, { useState } from "react";
import * as XLSX from "xlsx";

function Page() {
  const [removedParticipants, setRemovedParticipants] = useState([]);

  const handleFileRead = async (event) => {
    const file = event.target.files[0];
    const text = await file.text();
    parseChatLog(text);
  };

  const parseChatLog = (text) => {
    const removeRegex =
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2}\s[AP]M)\] ~ (.+?): ‎You removed (.+)$/gm;

    const removedParticipantsList = [];
    let match;

    while ((match = removeRegex.exec(text)) !== null) {
      const [, date, time, removedBy, removedName] = match;
      console.log("Match:", match); // Log the matched groups
      removedParticipantsList.push({
        date,
        name: removedName.trim(),
        removedBy: removedBy.trim(),
      });
    }

    setRemovedParticipants(removedParticipantsList);
    console.log("Removed Participants:", removedParticipantsList);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      removedParticipants.map((item, index) => ({
        Index: index + 1,
        Date: item.date,
        Name: item.name,
        RemovedBy: item.removedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Removed Participants");
    XLSX.writeFile(wb, "removedParticipants.xlsx");
  };

  return (
    <>
      <div>
        <input type="file" onChange={handleFileRead} accept=".txt" />
        <button className="export-button" onClick={exportToExcel}>
          Export Removed Participants to Excel
        </button>
        <div>
          {removedParticipants.map((data, index) => (
            <div key={index}>
              {index + 1}. {data.date} - {data.name} - Removed by:{" "}
              {data.removedBy}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Page;
