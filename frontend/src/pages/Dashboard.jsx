import React, { useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [botName, setBotName] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  const [botLink, setBotLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:3000/create-bot", {
        name: botName,
        prompt: botPrompt,
      });
      setBotLink(response.data.inviteLink);
    } catch (err) {
      setError("Failed to create bot. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle modal visibility
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center h-screen w-screen">
      <button
        onClick={toggleModal}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
      >
        Create New Bot
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">
              Create a New Discord Bot
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bot Name:
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  required
                  placeholder="Enter bot name"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bot Prompt:
                </label>
                <textarea
                  value={botPrompt}
                  onChange={(e) => setBotPrompt(e.target.value)}
                  required
                  placeholder="Enter bot prompt"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none"
              >
                {isLoading ? "Creating..." : "Create Bot"}
              </button>
            </form>

            {botLink && (
              <div className="mt-4 p-4 bg-green-100 rounded-md">
                <p className="font-semibold">
                  Bot Created! Here is the invite link:
                </p>
                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {botLink}
                </a>
              </div>
            )}

            {error && <div className="mt-4 text-red-500">{error}</div>}

            <button
              onClick={toggleModal}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
