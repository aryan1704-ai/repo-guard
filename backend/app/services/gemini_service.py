from importlib import import_module

from app.core.database import settings


genai = import_module("google.genai")
types = import_module("google.genai.types")


def get_gemini_client():
    """
    Create and return the Gemini client.
    """

    api_key = settings.GEMINI_API_KEY

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    return genai.Client(
        api_key=api_key
    )


def generate_ai_report(prompt: str) -> str:
    """
    Generate an AI security report using Gemini.
    """

    client = get_gemini_client()

    model = settings.GEMINI_MODEL

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=3000
        )
    )

    if not response.text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    return response.text