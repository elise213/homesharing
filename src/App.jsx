// "use client";
// import React, { useState } from "react";
// import * as XLSX from "xlsx"; // For reading the Excel file
// import initSqlJs from "sql.js"; // For SQLite in the browser

// // Helper function to convert Excel serial dates to readable date format
// const convertExcelDate = (excelDate) => {
//   const date = new Date((excelDate - 25569) * 86400 * 1000); // Convert Excel serial date
//   return (
//     date.toISOString().split("T")[0] + " " + date.toTimeString().split(" ")[0]
//   ); // Return in YYYY-MM-DD HH:MM:SS
// };

// // The App component
// function App() {
//   const [joinData, setJoinData] = useState([]);

//   // Load SQL.js and handle the file read process
//   const handleFileRead = async (event) => {
//     const file = event.target.files[0];

//     // Step 1: Read the Excel file using XLSX
//     const data = await file.arrayBuffer();
//     const workbook = XLSX.read(data, { type: "array" });
//     const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
//     const worksheet = workbook.Sheets[sheetName];

//     // Convert worksheet to JSON (array of objects)
//     const jsonData = XLSX.utils.sheet_to_json(worksheet);
//     console.log("Parsed Excel Data:", jsonData); // Debugging log

//     // Step 2: Initialize the SQL.js library
//     try {
//       const SQL = await initSqlJs({
//         locateFile: (file) =>
//           `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`,
//       });

//       // Create a new SQLite database in memory
//       const db = new SQL.Database();

//       // Step 3: Create a table in the SQLite database
//       db.run(`
//         CREATE TABLE group_chat (
//           ChatSession TEXT,
//           MessageDate TEXT,
//           SentDate TEXT,
//           Type TEXT,
//           SenderID TEXT,
//           SenderName TEXT,
//           Status TEXT,
//           ReplyingTo TEXT,
//           Text TEXT,
//           Attachment TEXT,
//           AttachmentType TEXT,
//           AttachmentInfo TEXT
//         );
//       `);

//       // Step 4: Insert the Excel data into the SQLite database
//       jsonData.forEach((row) => {
//         const insertQuery = `
//           INSERT INTO group_chat (
//             ChatSession, MessageDate, SentDate, Type, SenderID, SenderName, Status,
//             ReplyingTo, Text, Attachment, AttachmentType, AttachmentInfo
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//         const values = [
//           row["Chat Session"],
//           convertExcelDate(row["Message Date"]), // Convert the date
//           convertExcelDate(row["Sent Date"]), // Convert the date
//           row["Type"],
//           row["Sender ID"],
//           row["Sender Name"],
//           row["Status"],
//           row["Replying to"],
//           row["Text"],
//           row["Attachment"],
//           row["Attachment type"],
//           row["Attachment info"],
//         ];
//         db.run(insertQuery, values);
//       });

//       // Step 5: Query the database for both invite link joins and manual additions
//       const inviteMembersQuery = `
//         SELECT * FROM group_chat WHERE Text LIKE '%joined using this community''s invite link%'
//       `;
//       const manualMembersQuery = `
//         SELECT * FROM group_chat WHERE Text LIKE 'You added%'
//       `;

//       const inviteResult = db.exec(inviteMembersQuery);
//       const manualResult = db.exec(manualMembersQuery);

//       console.log("SQL Query Invite Result:", inviteResult); // Debugging log
//       console.log("SQL Query Manual Add Result:", manualResult); // Debugging log

//       // Combine and process the data
//       const allMembers = [];

//       if (inviteResult.length > 0) {
//         const inviteMembers = inviteResult[0].values.map((row) => ({
//           chatSession: row[0],
//           messageDate: row[1],
//           sentDate: row[2],
//           type: row[3],
//           senderID: row[4],
//           senderName: row[5],
//           status: row[6],
//           replyingTo: row[7],
//           text: row[8],
//           attachment: row[9],
//           attachmentType: row[10],
//           attachmentInfo: row[11],
//         }));
//         allMembers.push(...inviteMembers);
//       }

//       if (manualResult.length > 0) {
//         manualResult[0].values.forEach((row) => {
//           const text = row[8];
//           if (text.startsWith("You added")) {
//             const names = text.replace("You added ", "").split(","); // Split names by commas
//             names.forEach((name) => {
//               allMembers.push({
//                 chatSession: row[0],
//                 messageDate: row[1],
//                 sentDate: row[2],
//                 type: row[3],
//                 senderID: row[4],
//                 senderName: row[5],
//                 status: row[6],
//                 replyingTo: row[7],
//                 text: `You added ${name.trim()}`, // Assign each name separately
//                 attachment: row[9],
//                 attachmentType: row[10],
//                 attachmentInfo: row[11],
//               });
//             });
//           } else {
//             allMembers.push({
//               chatSession: row[0],
//               messageDate: row[1],
//               sentDate: row[2],
//               type: row[3],
//               senderID: row[4],
//               senderName: row[5],
//               status: row[6],
//               replyingTo: row[7],
//               text: row[8],
//               attachment: row[9],
//               attachmentType: row[10],
//               attachmentInfo: row[11],
//             });
//           }
//         });
//       }

//       // Step 6: Sort the data by messageDate (earliest to latest)
//       allMembers.sort(
//         (a, b) => new Date(a.messageDate) - new Date(b.messageDate)
//       );

//       // Set the sorted result data in state
//       setJoinData(allMembers);
//       console.log("Processed and Sorted Join Data:", allMembers); // Debugging log
//     } catch (err) {
//       console.error("Error loading SQL.js or processing file:", err); // Debugging log
//     }
//   };

//   // Export the data to an Excel file
//   const exportToExcel = () => {
//     if (joinData.length === 0) {
//       console.log("No data to export"); // If there is no data, prevent exporting a blank file
//       return;
//     }

//     const ws = XLSX.utils.json_to_sheet(
//       joinData.map((item) => ({
//         ChatSession: item.chatSession,
//         MessageDate: item.messageDate,
//         SentDate: item.sentDate,
//         Type: item.type,
//         SenderID: item.senderID,
//         SenderName: item.senderName,
//         Status: item.status,
//         ReplyingTo: item.replyingTo,
//         Text: item.text,
//         Attachment: item.attachment,
//         AttachmentType: item.attachmentType,
//         AttachmentInfo: item.attachmentInfo,
//       }))
//     );
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Join Data");
//     XLSX.writeFile(wb, "joinData.xlsx");
//   };

//   return (
//     <>
//       <div>
//         <h1>WhatsApp Group Data</h1>
//         <input type="file" onChange={handleFileRead} accept=".xlsx" />
//         <button className="export-button" onClick={exportToExcel}>
//           Export to Excel
//         </button>
//         <div>
//           {joinData.map((data, index) => (
//             <div key={index}>
//               {index + 1}. {data.messageDate} - {data.senderName} ({data.text})
//             </div>
//           ))}
//         </div>
//       </div>
//     </>
//   );
// }

// export default App;

"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx"; // For reading the Excel file
import initSqlJs from "sql.js"; // For SQLite in the browser

// Helper function to convert Excel serial dates to readable date format
const convertExcelDate = (excelDate) => {
  const date = new Date((excelDate - 25569) * 86400 * 1000); // Convert Excel serial date
  return (
    date.toISOString().split("T")[0] + " " + date.toTimeString().split(" ")[0]
  ); // Return in YYYY-MM-DD HH:MM:SS
};

// The App component
function App() {
  const [joinData, setJoinData] = useState([]);

  // Load SQL.js and handle the file read process
  const handleFileRead = async (event) => {
    const file = event.target.files[0];

    // Step 1: Read the Excel file using XLSX
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert worksheet to JSON (array of objects)
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log("Parsed Excel Data:", jsonData); // Debugging log

    // Step 2: Initialize the SQL.js library
    try {
      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`,
      });

      // Create a new SQLite database in memory
      const db = new SQL.Database();

      // Step 3: Create a table in the SQLite database
      db.run(`
        CREATE TABLE group_chat (
          ChatSession TEXT,
          MessageDate TEXT,
          SentDate TEXT,
          Type TEXT,
          SenderID TEXT,
          SenderName TEXT,
          Status TEXT,
          ReplyingTo TEXT,
          Text TEXT,
          Attachment TEXT,
          AttachmentType TEXT,
          AttachmentInfo TEXT
        );
      `);

      // Step 4: Insert the Excel data into the SQLite database
      jsonData.forEach((row) => {
        const insertQuery = `
          INSERT INTO group_chat (
            ChatSession, MessageDate, SentDate, Type, SenderID, SenderName, Status,
            ReplyingTo, Text, Attachment, AttachmentType, AttachmentInfo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          row["Chat Session"],
          convertExcelDate(row["Message Date"]), // Convert the date
          convertExcelDate(row["Sent Date"]), // Convert the date
          row["Type"],
          row["Sender ID"],
          row["Sender Name"],
          row["Status"],
          row["Replying to"],
          row["Text"],
          row["Attachment"],
          row["Attachment type"],
          row["Attachment info"],
        ];
        db.run(insertQuery, values);
      });

      // Step 5: Query the database for both invite link joins and manual additions
      const inviteMembersQuery = `
        SELECT * FROM group_chat WHERE Text LIKE '%joined using this community''s invite link%'
      `;
      const manualMembersQuery = `
        SELECT * FROM group_chat WHERE Text LIKE 'You added%'
      `;
      const removalMembersQuery = `
        SELECT * FROM group_chat WHERE Text LIKE 'You removed%' OR Text LIKE '%left'
      `;

      const inviteResult = db.exec(inviteMembersQuery);
      const manualResult = db.exec(manualMembersQuery);
      const removalResult = db.exec(removalMembersQuery);

      console.log("SQL Query Invite Result:", inviteResult); // Debugging log
      console.log("SQL Query Manual Add Result:", manualResult); // Debugging log
      console.log("SQL Query Removal Result:", removalResult); // Debugging log

      // Combine and process the data
      const allMembers = [];
      const memberCounts = {};

      // Helper function to update member counts
      const updateMemberCount = (name, type) => {
        if (!memberCounts[name]) {
          memberCounts[name] = { added: 0, removed: 0 };
        }
        memberCounts[name][type]++;
      };

      if (inviteResult.length > 0) {
        inviteResult[0].values.forEach((row) => {
          const name = row[8].match(/"(.*)" joined/)[1];
          allMembers.push({
            chatSession: row[0],
            messageDate: row[1],
            sentDate: row[2],
            type: row[3],
            senderID: row[4],
            senderName: row[5],
            status: row[6],
            replyingTo: row[7],
            text: row[8],
            attachment: row[9],
            attachmentType: row[10],
            attachmentInfo: row[11],
          });
          updateMemberCount(name, "added");
        });
      }

      if (manualResult.length > 0) {
        manualResult[0].values.forEach((row) => {
          const text = row[8];
          const names = text.replace("You added ", "").split(","); // Split names by commas
          names.forEach((name) => {
            name = name.trim();
            allMembers.push({
              chatSession: row[0],
              messageDate: row[1],
              sentDate: row[2],
              type: row[3],
              senderID: row[4],
              senderName: row[5],
              status: row[6],
              replyingTo: row[7],
              text: `You added ${name}`,
              attachment: row[9],
              attachmentType: row[10],
              attachmentInfo: row[11],
            });
            updateMemberCount(name, "added");
          });
        });
      }

      if (removalResult.length > 0) {
        removalResult[0].values.forEach((row) => {
          const text = row[8];
          const nameMatch = text.match(/You removed (.*)|(.+) left/);
          const name = nameMatch ? nameMatch[1] || nameMatch[2] : null;
          if (name) {
            updateMemberCount(name.trim(), "removed");
          }
        });
      }

      // Filter out members where the add count equals the remove count
      const filteredMembers = allMembers.filter((member) => {
        const name = member.text.replace("You added ", "").trim();
        return (
          memberCounts[name] &&
          memberCounts[name].added !== memberCounts[name].removed
        );
      });

      // Step 6: Sort the data by messageDate (earliest to latest)
      filteredMembers.sort(
        (a, b) => new Date(a.messageDate) - new Date(b.messageDate)
      );

      // Set the filtered and sorted result data in state
      setJoinData(filteredMembers);
      console.log("Processed and Sorted Join Data:", filteredMembers); // Debugging log
    } catch (err) {
      console.error("Error loading SQL.js or processing file:", err); // Debugging log
    }
  };

  // Export the data to an Excel file
  const exportToExcel = () => {
    if (joinData.length === 0) {
      console.log("No data to export"); // If there is no data, prevent exporting a blank file
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      joinData.map((item) => ({
        ChatSession: item.chatSession,
        MessageDate: item.messageDate,
        SentDate: item.sentDate,
        Type: item.type,
        SenderID: item.senderID,
        SenderName: item.senderName,
        Status: item.status,
        ReplyingTo: item.replyingTo,
        Text: item.text,
        Attachment: item.attachment,
        AttachmentType: item.attachmentType,
        AttachmentInfo: item.attachmentInfo,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Join Data");
    XLSX.writeFile(wb, "joinData.xlsx");
  };

  return (
    <>
      <div>
        <h1>WhatsApp Group Data</h1>
        <input type="file" onChange={handleFileRead} accept=".xlsx" />
        <button className="export-button" onClick={exportToExcel}>
          Export to Excel
        </button>
        <div>
          {joinData.map((data, index) => (
            <div key={index}>
              {index + 1}. {data.messageDate} - {data.senderName} ({data.text})
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
