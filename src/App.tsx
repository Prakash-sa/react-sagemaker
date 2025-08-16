import { useState } from "react";
import "./App.css";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";

const MODEL_NAME = "assistant";
const USER_NAME = "user";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/chat';

type Role = typeof MODEL_NAME | typeof USER_NAME;

interface IMessage {
    role: Role;
    content: { text: string }[];
}

interface InputJson {
    inputs: string;
    parameters?: {
        temperature?: number;
        max_new_tokens?: number;
        top_p?: number;
    };
}

interface ApiResponse {
    response: string;
    error?: string;
}

function App() {
    const [history, setHistory] = useState<IMessage[]>([]);
    const [stream, _setStream] = useState<string | null>(null);

    const sendResponse = async (input: InputJson) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            
            console.log(data)
            if (data.error) {
                throw new Error(data.error);
            }

            return data.response;
        } catch (error) {
            console.error('Error:', error);
            return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
        }
    };

    const addToHistory = (text: string, role: Role) => {
        setHistory((prev) => [...prev, { content: [{ text }], role }]);
    };

    const onSubmit = async (prompt: string) => {
        addToHistory(prompt, USER_NAME);
        const inputJson: InputJson = {
            inputs: prompt,
            parameters: {
                temperature: 0.6,
                max_new_tokens: 64,
                top_p: 0.9
            }
        };
        const response = await sendResponse(inputJson);
        addToHistory(response, MODEL_NAME);
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="overflow-y-scroll flex-1">
                {history.map(({ role, content }) => (
                    <ChatMessage
                        key={content[0].text}
                        author={role}
                        reverse={role === USER_NAME}
                        text={content[0].text || ""}
                    />
                ))}

                {stream && (
                    <ChatMessage
                        key={stream}
                        author={MODEL_NAME}
                        reverse={false}
                        text={stream}
                    />
                )}
            </div>

            <div className="flex items-center justify-between mt-auto h-20 sticky bottom-0 left-0 right-0">
                <ChatInput onSubmit={onSubmit} />
            </div>
        </div>
    );
}

export default App;
