import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const CreateBotModal = ({
  isOpen,
  toggleModal,
  botName,
  setBotName,
  botPrompt,
  setBotPrompt,
  botToken,
  setBotToken,
  handleSubmit,
  isLoading,
  botLink,
  error,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleModal}
          className="bg-gray-600/50 backdrop-blur p-8 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0, rotate: "12.5deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            exit={{ scale: 0, rotate: "0deg" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-300 text-black p-6 rounded-lg w-full max-w-lg shadow-xl cursor-default relative overflow-hidden"
          >
            <h2 className="text-xl font-semibold mb-4 text-center">
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
                  className="w-full mt-1 p-2 border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
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
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring bg-gray-300 focus:ring-blue-200"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bot Token:
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                  placeholder="Enter bot token"
                  className="w-full mt-1 p-2 border bg-gray-300 border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-400 rounded-md hover:bg-blue-500"
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
              className="mt-4 bg-gray-300 px-4 py-2 rounded-md focus:outline-none"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateBotModal;
