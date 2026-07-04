import { pipeline, env } from "@huggingface/transformers";

// Disable local-only model search so it fetches from Hugging Face Hub
env.allowLocalModels = false;

let generator: any = null;

export async function loadModel() {
    if (generator) return generator;

    console.log("Loading Hugging Face SmolLM2-360M-Instruct model (locally running on server)...");
    try {
        generator = await pipeline(
            "text-generation",
            "HuggingFaceTB/SmolLM2-360M-Instruct"
        );
        console.log("SmolLM2-360M-Instruct model loaded successfully and is ready to process queries locally!");
    } catch (err) {
        console.error("Error loading Hugging Face SmolLM2-360M-Instruct model:", err);
        throw err;
    }

    return generator;
}

export async function generate(prompt: string): Promise<string> {
    const model = await loadModel();

    try {
        const result = await model(prompt, {
            max_new_tokens: 64,
            temperature: 0.7,
            do_sample: true,
        });

        // The returned text contains the prompt + generated text depending on the configuration.
        // Let's make sure we extract only the new generated text or clean it up if needed.
        let generatedText = result[0].generated_text;
        
        // If the model appends the prompt itself, we can strip it
        if (generatedText.startsWith(prompt)) {
            generatedText = generatedText.slice(prompt.length);
        }
        
        return generatedText.trim();
    } catch (err) {
        console.error("Generation error in local LLM:", err);
        throw err;
    }
}
