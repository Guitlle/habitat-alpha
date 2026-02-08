import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";

// Ensure API key is present
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Tool Definitions ---

const addMemoryNodeTool: FunctionDeclaration = {
  name: 'addMemoryNode',
  description: 'Add a new concept node to the memory graph visualization.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: 'The name of the concept.' },
      group: { type: Type.NUMBER, description: 'Group ID (1=Core, 2=Value, 3=Project, 4=Task).' },
      importance: { type: Type.NUMBER, description: 'Importance value (radius size).' },
    },
    required: ['label', 'group'],
  },
};

const createProjectTool: FunctionDeclaration = {
  name: 'createProject',
  description: 'Create a new project in the work organization system.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Project title.' },
      description: { type: Type.STRING, description: 'Brief description.' },
      goal: { type: Type.STRING, description: 'The ultimate goal of this project.' },
    },
    required: ['title', 'description', 'goal'],
  },
};

const createTaskTool: FunctionDeclaration = {
  name: 'createTask',
  description: 'Create a new task under an epic.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task title.' },
      epicId: { type: Type.STRING, description: 'The ID of the epic this task belongs to (optional).' },
      status: { type: Type.STRING, description: 'Initial status (TODO, IN_PROGRESS).' },
    },
    required: ['title'],
  },
};

const searchWikipediaTool: FunctionDeclaration = {
  name: 'searchWikipedia',
  description: 'Search Wikipedia for information about a specific topic to assist the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query topic.' },
    },
    required: ['query'],
  },
};

const tools: Tool[] = [{
  functionDeclarations: [addMemoryNodeTool, createProjectTool, createTaskTool, searchWikipediaTool],
}];

export const generateResponse = async (
  prompt: string,
  history: any[], // Chat history
  systemInstruction: string = "You are a helpful AI assistant managing a user's cognitive workspace."
) => {
  if (!API_KEY) {
    return {
      text: "Error: API_KEY is missing in the environment variables. Please check your setup.",
      functionCalls: []
    };
  }

  try {
    const model = 'gemini-3-flash-preview'; 
    
    // Construct chat history for context
    // Ideally we use ai.chats.create but for single turn with tools, models.generateContent is often easier to manage statelessly here
    // However, let's use generateContent with contents array for history + new prompt
    
    const contents = [
       ...history.map(m => ({
         role: m.role,
         parts: [{ text: m.content }]
       })),
       {
         role: 'user',
         parts: [{ text: prompt }]
       }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools,
      },
    });

    const candidate = response.candidates?.[0];
    const modelText = candidate?.content?.parts?.find(p => p.text)?.text || '';
    
    // Extract function calls
    const functionCalls = candidate?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => p.functionCall) || [];

    return {
      text: modelText,
      functionCalls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I encountered an error communicating with the AI service.",
      functionCalls: []
    };
  }
};