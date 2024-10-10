import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ManageBot = () => {
  const [botActive, setBotActive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [generatedLeads, setGeneratedLeads] = useState([]); // New state for storing leads
  const { botToken, botId, status } = useParams();
  const [newStatus, setNewStatus] = useState(false);
  console.log("status", status);
  console.log("newStatus", newStatus);

  // Handle edge cases for user parsing
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // Add useEffect to set initial bot status
  useEffect(() => {
    if (status) {
      setBotActive(true);
      setNewStatus(true);
    } else {
      setBotActive(false);
      setNewStatus(true);
    }
  }, [status]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSavePrompt = async () => {
    try {
      await axios.post("/api/bot/update-prompt", { prompt });
      alert("Bot prompt updated successfully");
    } catch (error) {
      alert("Failed to update bot prompt");
    }
  };

  const handleBotToggle = async () => {
    try {
      const response = await axios.post("http://localhost:3000/toggle-bot", {
        botId: Number(botId),
        userId: user.id,
        status: newStatus,
      });

      if (response.data.bot) {
        setBotActive(response.data.bot.status);

        alert(
          `Bot ${
            response.data.bot.status ? "activated" : "deactivated"
          } successfully`
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to toggle bot status:", error);
      alert(
        `Failed to toggle bot status: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleGenerateLeads = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/leads?keywords=${keywords}&discordBotToken=${botToken}`
      );
      setGeneratedLeads(response.data); // Store the generated leads
    } catch (error) {
      alert("Failed to generate leads");
    } finally {
      setIsModalVisible(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manage Your Bot</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Bot Status</h2>
        <button
          onClick={handleBotToggle}
          className={`px-4 py-2 rounded ${
            botActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {botActive ? "On" : "Off"}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Bot Prompt</h2>
        <textarea
          rows={4}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter your bot's prompt here..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleSavePrompt}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Prompt
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Leads</h2>
        <button
          onClick={showModal}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Generate Leads
        </button>
      </div>

      {generatedLeads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Generated Leads</h2>
          <ul className="list-disc pl-5">
            {generatedLeads.map((lead, index) => (
              <li key={index} className="mb-2">
                <strong>Keyword:</strong> {lead.keyword}
                <br />
                <strong>Message:</strong> {lead.message}
                <br />
                <strong>Author:</strong> {lead.author}
                <br />
                <strong>Channel:</strong> {lead.channel}
                <br />
                <strong>Guild:</strong> {lead.guild}
                <br />
                <strong>Timestamp:</strong>{" "}
                {new Date(lead.timestamp).toLocaleString()}
                <br />
                <strong>Channel Type:</strong> {lead.channelType}
                <br />
                {lead.threadName && (
                  <>
                    <strong>Thread Name:</strong> {lead.threadName}
                    <br />
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Generate Leads</h3>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords to search for leads"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalVisible(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateLeads}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBot;
