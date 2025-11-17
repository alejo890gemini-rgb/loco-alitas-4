import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { PaymentMethod, MenuItem, Table, Sale, InventoryItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMenuDescription = async (dishName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a short, delicious-sounding, and appealing menu description for a dish called "${dishName}". The description should be no more than 25 words. Be creative, enticing, and use culinary terms.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating menu description:", error);
    return `A classic version of ${dishName}. (Error fetching AI description)`;
  }
};

export const generateImageForDish = async (dishName: string, dishDescription: string): Promise<string> => {
  const prompt = `A professional, appetizing, vibrant, high-resolution photo of a restaurant dish called '${dishName}'. 
  Description: '${dishDescription}'.
  The food should be beautifully presented on a clean plate, with a slightly blurred, colorful restaurant background. 
  The lighting should be bright and make the food look delicious. 
  Style: commercial food photography, hyper-realistic, mouth-watering.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image data found in response');
  } catch (error) {
    console.error("Error generating image:", error);
    return ""; // Return empty string or a placeholder URL on error
  }
};


export const getUpsellSuggestions = async (
  currentItems: { name: string; quantity: number }[],
  menuItems: { name: string; category: string }[]
): Promise<string[]> => {
  if (currentItems.length === 0) {
    return [];
  }
  
  const currentItemNames = currentItems.map(item => item.name);
  // Filter out items already in the order
  const availableMenuItems = menuItems.filter(item => !currentItemNames.includes(item.name));

  const prompt = `
    Based on the current order, suggest 3 items from the menu that would be a great addition.
    Consider complementary items like drinks with food, or desserts.
    Do not suggest items that are already in the order.
    
    Current Order:
    ${currentItems.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}
    
    Full Menu (name and category):
    ${availableMenuItems.map(item => `- ${item.name} (${item.category})`).join('\n')}

    Return ONLY a JSON array of the exact names of the 3 suggested items. For example: ["Locaburguer", "Limonada de Verano", "Gelato (1 Sabor)"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
        }
      },
    });

    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);
    
    if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
      return suggestions;
    }
    return [];
  } catch (error) {
    console.error("Error getting upsell suggestions:", error);
    return [];
  }
};


export interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  topSellingItems: { name: string; count: number }[];
  revenueByPaymentMethod: Record<PaymentMethod, number>;
}

export const generateSalesReport = async (data: ReportData): Promise<string> => {
    const prompt = `
        You are a business analyst for a restaurant named "Loco Alitas". 
        Analyze the following sales data for a specific period and generate a concise, insightful summary for the restaurant owner.
        The summary should be a maximum of 100 words.
        Highlight key trends, top-performing items, and suggest one potential area for improvement or a business opportunity.
        Be professional, data-driven, and encouraging.

        Sales Data:
        - Total Revenue: ${data.totalRevenue.toFixed(0)} COP
        - Total Orders: ${data.totalOrders}
        - Top 3 Selling Items: ${data.topSellingItems.map(item => `${item.name} (${item.count} sold)`).join(', ')}
        - Revenue by Payment Method: ${JSON.stringify(data.revenueByPaymentMethod)}

        Provide the response as a single block of text in Spanish.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating sales report:", error);
        return "No se pudo generar el resumen del reporte. Por favor, intente de nuevo.";
    }
};

export const getChatbotResponse = async (
  query: string,
  context: {
    menu: MenuItem[];
    tables: Table[];
    sales: Sale[];
    inventory: InventoryItem[];
  }
): Promise<string> => {
  // Simplify context for the prompt to avoid exceeding token limits
  const simplifiedMenu = context.menu.map(item => `${item.name} (${item.price} COP) - ${item.category}`).join('\n');
  const simplifiedTables = context.tables.map(table => `Mesa '${table.name}' (${table.capacity} asientos) está ${table.status}`).join('\n');
  const simplifiedInventory = context.inventory.map(item => `${item.name}: ${item.stock.toFixed(2)} ${item.unit}`).join('\n');
  
  const todaySales = context.sales.filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString());
  const totalRevenueToday = todaySales.reduce((acc, sale) => acc + sale.total, 0);

  const prompt = `
    System Instruction:
    You are "LocoBot", an expert AI assistant for the "Loco Alitas" restaurant.
    Your personality is helpful, concise, and slightly playful, matching the "loco" theme.
    You MUST answer questions based ONLY on the context provided below.
    If the answer is not in the context, say "No tengo esa información, ¡pero puedo preguntarle al chef!".
    Keep answers short and to the point. Answer in Spanish.

    Context:
    ---
    MENU:
    ${simplifiedMenu}
    ---
    TABLES:
    ${simplifiedTables}
    ---
    INVENTORY:
    ${simplifiedInventory}
    ---
    SALES TODAY:
    - Total Revenue Today: ${totalRevenueToday.toFixed(0)} COP
    - Total Orders Today: ${todaySales.length}
    ---

    User Query: "${query}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    return "Lo siento, tuve un problema para procesar tu pregunta. Inténtalo de nuevo.";
  }
};