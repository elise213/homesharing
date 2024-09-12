"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx"; // For reading the Excel file
import initSqlJs from "sql.js"; // For SQLite in the browser

// Helper function to convert Excel serial dates or valid dates to readable date format
const convertExcelDate = (excelDate) => {
  if (typeof excelDate === "number") {
    const date = new Date((excelDate - 25569) * 86400 * 1000); // Convert Excel serial date
    return `${date.toISOString().split("T")[0]} ${
      date.toTimeString().split(" ")[0]
    }`; // Return in YYYY-MM-DD HH:MM:SS
  } else if (typeof excelDate === "string" && !isNaN(Date.parse(excelDate))) {
    return excelDate;
  }
  return ""; // Return empty string for invalid or empty dates
};

// Function to initialize SQLite and create a group_chat table
const initializeDatabase = async (data, jsonData) => {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`,
  });

  const db = new SQL.Database();

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

  jsonData.forEach((row) => {
    const insertQuery = `
      INSERT INTO group_chat (
        ChatSession, MessageDate, SentDate, Type, SenderID, SenderName, Status,
        ReplyingTo, Text, Attachment, AttachmentType, AttachmentInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      row["Chat Session"],
      convertExcelDate(row["Message Date"]),
      convertExcelDate(row["Sent Date"]),
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

  return db;
};

// Function to query SQLite database for added, removed members
const queryMembers = (db) => {
  const inviteMembersQuery = `SELECT * FROM group_chat WHERE Text LIKE '%joined using this community%'`;
  const manualMembersQuery = `SELECT * FROM group_chat WHERE Text LIKE 'You added%'`;
  const removalMembersQuery = `SELECT * FROM group_chat WHERE Text LIKE 'You removed%' OR Text LIKE '%left%'`;

  const inviteResult = db.exec(inviteMembersQuery);
  const manualResult = db.exec(manualMembersQuery);
  const removalResult = db.exec(removalMembersQuery);

  // Logging the results to see the raw data
  console.log("Invite Result Raw Data:", inviteResult);
  console.log("Manual Result Raw Data:", manualResult);
  console.log("Removal Result Raw Data:", removalResult);

  return { inviteResult, manualResult, removalResult };
};

const processMembers = (inviteResult, manualResult, removalResult) => {
  const allMembers = [];
  const memberCounts = {};

  const updateMemberCount = (name, type) => {
    if (!memberCounts[name]) {
      memberCounts[name] = { added: 0, removed: 0 };
    }
    memberCounts[name][type]++;
  };

  // Handle members who joined via invite link
  inviteResult?.[0]?.values.forEach((row) => {
    const text = row[8];
    const nameMatch = text.match(
      /((\+\d{9,15})|([A-Za-z\s]+)) joined using this community's invite link/
    );

    if (nameMatch) {
      const name = nameMatch[1].trim();
      allMembers.push({
        chatSession: row[0],
        messageDate: row[1],
        sentDate: row[2],
        text: `Joined using invite link: ${name}`,
      });
      updateMemberCount(name, "added");
    }
  });

  // Handle members added manually
  manualResult?.[0]?.values.forEach((row) => {
    const names = row[8].replace("You added ", "").split(",");
    names.forEach((name) => {
      name = name.trim();
      allMembers.push({
        chatSession: row[0],
        messageDate: row[1],
        sentDate: row[2],
        text: `You added ${name}`,
      });
      updateMemberCount(name, "added");
    });
  });

  // Handle members removed or left
  removalResult?.[0]?.values.forEach((row) => {
    const nameMatch = row[8].match(/You removed (.*)|(.+) left/);
    const name = nameMatch ? nameMatch[1] || nameMatch[2] : null;
    if (name) {
      updateMemberCount(name.trim(), "removed");
    }
  });

  console.log("All Members Before Filtering:", allMembers);
  console.log("Member Counts Before Filtering:", memberCounts);

  // Filter out members where the add count equals the remove count
  const filteredMembers = allMembers.filter((member) => {
    const name = member.text
      .replace("You added ", "")
      .replace("Joined using invite link: ", "")
      .trim();

    // Only filter out members if they were added and removed the same number of times
    return (
      memberCounts[name] &&
      memberCounts[name].added !== memberCounts[name].removed
    );
  });

  console.log("Filtered Members After Adjustments:", filteredMembers);
  return filteredMembers;
};

const App = () => {
  const [joinData, setJoinData] = useState([]);

  const handleFileRead = async (event) => {
    const file = event.target.files[0];

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Use first sheet
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    try {
      const db = await initializeDatabase(data, jsonData);
      const { inviteResult, manualResult, removalResult } = queryMembers(db);
      const filteredMembers = processMembers(
        inviteResult,
        manualResult,
        removalResult
      );
      setJoinData(filteredMembers);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const exportToExcel = () => {
    if (joinData.length === 0) {
      console.log("No data to export");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      joinData.map((item) => ({
        ChatSession: item.chatSession,
        MessageDate: item.messageDate,
        SentDate: item.sentDate,
        Text: item.text,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Join Data");
    XLSX.writeFile(wb, "joinData.xlsx");
  };

  return (
    <div>
      <h1>WhatsApp Group Data</h1>
      <input type="file" onChange={handleFileRead} accept=".xlsx" />
      <button onClick={exportToExcel}>Export to Excel</button>
      <div>
        {joinData.map((data, index) => (
          <div key={index}>
            {index + 1}. {data.messageDate} - {data.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
