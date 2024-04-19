import React, { useState } from "react";
import * as XLSX from "xlsx";

function App() {
  const [joinData, setJoinData] = useState([]);

  const handleFileRead = async (event) => {
    const file = event.target.files[0];
    const text = await file.text();
    parseChatLog(text);
  };

  const parseChatLog = (text) => {
    const lines = text.split("\n"); // Split the text into lines
    const results = [];
    const joinPhrase = "joined using this group's invite link"; // Define the phrase to look for

    lines.forEach((line, index) => {
      if (line.includes(joinPhrase)) {
        const regex =
          /\[(\d{1,2}\/\d{1,2}\/\d{2,4}), \d{1,2}:\d{2}:\d{2}\s[AP]M\]\s([^:]+?):/; // Adjusted regex to capture date and name/number
        const matches = regex.exec(line);
        if (matches) {
          let cleanName = matches[2]
            .trim()
            .replace(/[\u200E\u200F\u202A\u202C~\s]/g, ""); // Normalize the name/phone number and remove special characters and leading tildes
          if (cleanName.startsWith("+")) {
            // Check if it's a phone number
            cleanName = cleanName.substring(1); // Remove the leading '+'
          }
          results.push({
            index: index + 1, // Number each entry starting from 1
            date: matches[1],
            name: cleanName,
          });
        }
      }
    });

    setJoinData(results);
    console.log("Join Entries Found:", results);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      joinData.map((item) => ({
        Index: item.index,
        Date: item.date,
        Name: item.name,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Join Data");
    XLSX.writeFile(wb, "joinData.xlsx");
  };

  return (
    <>
      <div>
        <input type="file" onChange={handleFileRead} accept=".txt" />
        <button className="export-button" onClick={exportToExcel}>
          Export to Excel
        </button>
        <div>
          {joinData.map((data, index) => (
            <div key={index}>
              {index + 1}. {data.date} - {data.name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
