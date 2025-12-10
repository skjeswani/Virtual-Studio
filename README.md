# Virtual Studio 📸✨

**Virtual Studio** is an advanced AI-powered product photography application that acts as your virtual creative director. It transforms simple product reference images into professional, high-quality marketing assets using Google's Gemini 2.5 models.

## 🚀 Overview

Designed for e-commerce brands and content creators, Virtual Studio eliminates the need for expensive photoshoots. Users can upload a product image, build their own personal catalog of favorite generations, define a theme (e.g., "Luxury minimalist podium"), and generate stunning visuals in seconds.

The application leverages a powerful multi-model approach:
1.  **Gemini 2.5 Flash** acts as the creative director, generating detailed, photographer-grade prompts based on your theme, style, and product details.
2.  **Gemini 2.5 Flash Image** acts as the photographer, generating high-resolution, professional visuals that adhere strictly to those prompts and your specific reference image.

## ✨ Key Features

### 🧠 AI-Powered Workflow
*   **Smart Product Identification:** Upload any image, and the app uses Gemini Vision to automatically identify the product category.
*   **Personal Catalog:** Save your favorite generated images to a local catalog in your browser. Use any saved item as a reference for future generations.
*   **Virtual Creative Director:** Converts simple user themes into complex, professional photography prompts (handling lighting, composition, and texture details).
*   **Reference-Guided Generation:** Uses the uploaded or selected catalog image as a strict reference to ensure brand consistency in the generated output.

### 🎨 Customization & Control
*   **Style Presets:** Choose from *Natural*, *Studio*, *Artistic*, or *Photoshoot* styles.
*   **Model Integration:** Option to generate images with or without human models.
*   **Aspect Ratios:** Support for Square (1:1), Wide (16:9), and Tall (9:16) formats.
*   **🇮🇳 Indian Context Mode:** A dedicated toggle that intelligently adapts scenes, props, and backgrounds to fit modern Indian aesthetics.

### ⚡ Performance & UX
*   **Real-time Batch Generation:** Generate up to 8 images in a single run with a streaming gallery experience.
*   **Dark/Light Mode:** Fully responsive UI with seamless theme switching.
*   **Export Tools:** Download individual images, copy prompts to clipboard, or export the entire batch as a ZIP file.

## 📸 Screenshots

### 1. Select Product
*Upload a new reference image or choose a previously saved item from your personal catalog.*
![Select Product Interface](./screenshots/1_select_product.png)

### 2. Configure Settings
*Define your vision with the Theme and Product Details. Select styles, model preferences, and aspect ratios.*
![Configuration Controls](./screenshots/2_configure_settings.png)

### 3. Studio Ready
*The interface is primed and ready. The reference image is loaded, and the AI is standing by to generate your assets.*
![Studio Ready State](./screenshots/3_studio_ready.png)

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** `@google/genai` (Google GenAI SDK)
*   **Models:**
    *   `gemini-2.5-flash` (Prompt Engineering & Vision)
    *   `gemini-2.5-flash-image` (Image Generation)

## ⚙️ Local Development Setup

Follow these instructions to run Virtual Studio on your local machine.

### Prerequisites

*   **Node.js**: Ensure you have Node.js (v18 or higher) installed.
*   **Google API Key**: You need a valid API key from [Google AI Studio](https://aistudio.google.com/).
    *   *Note: Ensure your API key has access to the `gemini-2.5-flash` and `gemini-2.5-flash-image` models.*

### Installation Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/virtual-studio.git
    cd virtual-studio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a new file named `.env` in the root of your project directory. Add your Google AI API key to this file:
    ```
    API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ```
    *Replace `YOUR_GOOGLE_AI_API_KEY` with your actual key starting with `AIza...`*

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).

## 📖 How to Use

1.  **Upload a Product:** Click "Upload New" to select an image from your device. The app will identify it and set it as your reference.
2.  **Define the Theme:** Enter a descriptive theme (e.g., "Summer skincare on a beach rock").
3.  **Refine Settings:**
    *   Add specific product details if needed.
    *   Select a style (e.g., Studio).
    *   Choose whether to include a model.
    *   Set the aspect ratio and image count.
4.  **Generate:** Click "Generate Images". The AI will first craft prompts and then stream the generated images into the gallery.
5.  **Save to Catalog:** Hover over a generated image and click the "Add to Catalog" (+) icon to save it for future use.
6.  **Reuse from Catalog:** Your saved items will appear in the left panel. Click any of them to use it as the reference for a new generation.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).