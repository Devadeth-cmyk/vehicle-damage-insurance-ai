import requests

from search_knowledge_base import (
    search_knowledge_base,
    get_companies,
)

# ============================================================
# CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2"

OLLAMA_TIMEOUT = 180

TOP_K = 2

MAX_CHARS_PER_CHUNK = 2500


# ============================================================
# BUILD CONTEXT
# ============================================================

def build_context(results):

    context_parts = []

    for i, result in enumerate(results, 1):

        content = result["content"]

        if len(content) > MAX_CHARS_PER_CHUNK:
            content = (
                content[:MAX_CHARS_PER_CHUNK]
                + "\n[Content truncated]"
            )

        source = (
            f"SOURCE {i}\n"
            f"Company: {result['company']}\n"
            f"Document: {result['document']}\n"
            f"Pages: "
            f"{result['page_start']}-"
            f"{result['page_end']}\n"
            f"Chunk: {result['chunk_id']}\n"
            f"Similarity: {result['similarity']:.4f}\n"
            f"Content:\n{content}"
        )

        context_parts.append(source)

    return "\n\n".join(context_parts)


# ============================================================
# GENERATE ANSWER
# ============================================================

def generate_answer(company, question, results):

    context = build_context(results)

    prompt = f"""
You are a vehicle insurance policy assistant.

The user selected this insurance company:

{company}

The user's question is:

{question}

Answer ONLY using the policy information provided
in the context below.

IMPORTANT RULES:

1. Answer only for {company}.

2. Do not use information from another insurance company.

3. Do not invent information.

4. Do not assume coverage that is not explicitly stated.

5. If the information is not available in the
   retrieved policy context, say:

"I could not find this information in the
provided policy documents."

6. Clearly distinguish between:
   - Coverage
   - Exclusions
   - Conditions
   - Procedures

7. If the question asks about coverage, state whether
   the policy information indicates:
   - Covered
   - Not covered
   - Partially covered
   - Not clearly specified

8. If the question asks for a procedure, provide
   clear numbered steps.

9. Mention the policy document when useful.

10. Include page numbers when available.

11. Keep the answer concise.

12. Use simple language.

POLICY CONTEXT:

{context}

USER QUESTION:

{question}

ANSWER:
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "10m",
            "options": {
                "temperature": 0.1,
                "num_ctx": 4096,
                "num_predict": 300,
            },
        },
        timeout=OLLAMA_TIMEOUT,
    )

    response.raise_for_status()

    data = response.json()

    return data["response"].strip()


# ============================================================
# SELECT COMPANY
# ============================================================

def select_company():

    companies = get_companies()

    if not companies:
        raise RuntimeError(
            "No insurance companies found."
        )

    print("\n" + "=" * 80)
    print("AVAILABLE INSURANCE COMPANIES")
    print("=" * 80)

    for i, company in enumerate(companies, start=1):
        print(f"{i}. {company}")

    print("\nType 'exit' to quit.")

    while True:

        choice = input(
            "\nSelect insurance company: "
        ).strip()

        if choice.lower() in [
            "exit",
            "quit",
            "q",
        ]:
            return None

        try:

            index = int(choice)

            if 1 <= index <= len(companies):
                return companies[index - 1]

        except ValueError:
            pass

        print(
            f"Please enter a number between "
            f"1 and {len(companies)}."
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 80)
    print("VEHICLE INSURANCE RAG ASSISTANT")
    print("=" * 80)

    company = select_company()

    if company is None:
        print("\nGoodbye.")
        return

    print("\n" + "=" * 80)
    print(f"SELECTED COMPANY: {company}")
    print("=" * 80)

    print("\nType 'company' to change company.")
    print("Type 'exit' to quit.")

    while True:

        question = input(
            f"\nQuestion ({company}): "
        ).strip()

        if question.lower() in [
            "exit",
            "quit",
            "q",
        ]:
            break

        if question.lower() == "company":

            company = select_company()

            if company is None:
                break

            continue

        if not question:
            continue

        print("\nSearching policy documents...")

        try:

            results = search_knowledge_base(
                company=company,
                question=question,
                top_k=TOP_K,
            )

        except Exception as e:

            print(
                "\nERROR: Knowledge base search failed."
            )
            print(f"Details: {e}")
            continue

        if not results:

            print(
                "\nI could not find relevant information "
                "in the selected company's policy documents."
            )

            continue

        print(
            f"✓ Retrieved {len(results)} "
            f"policy chunk(s)."
        )

        print(
            f"✓ Best similarity: "
            f"{results[0]['similarity']:.4f}"
        )

        print("\nGenerating answer...")

        try:

            answer = generate_answer(
                company,
                question,
                results,
            )

            print("\n" + "=" * 80)
            print("ANSWER")
            print("=" * 80)

            print(answer)

            print("\n" + "-" * 80)
            print("SOURCES")
            print("-" * 80)

            for result in results:

                print(
                    f"- {result['document']} | "
                    f"Pages "
                    f"{result['page_start']}-"
                    f"{result['page_end']} | "
                    f"Similarity "
                    f"{result['similarity']:.4f}"
                )

            print("=" * 80)

        except requests.exceptions.Timeout:

            print(
                "\nERROR: Ollama took too long to respond."
            )

        except requests.exceptions.ConnectionError:

            print(
                "\nERROR: Could not connect to Ollama."
            )

            print(
                "Make sure Ollama is running on "
                "localhost:11434."
            )

        except requests.RequestException as e:

            print(
                "\nERROR: Ollama request failed."
            )

            print(f"Details: {e}")

        except Exception as e:

            print(
                "\nERROR: Unexpected error."
            )

            print(f"Details: {e}")


if __name__ == "__main__":
    main()
    