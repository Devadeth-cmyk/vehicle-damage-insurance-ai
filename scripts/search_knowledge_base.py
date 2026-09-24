import json
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer
import requests


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

VECTOR_DB_DIR = BASE_DIR / "processed" / "vector_db"
CHUNKS_FILE = BASE_DIR / "processed" / "chunks" / "all_chunks.json"

COLLECTION_NAME = "insurance_policies"
MODEL_NAME = "all-MiniLM-L6-v2"

# IMPORTANT:
# This must match the model shown by `ollama list`
OLLAMA_MODEL = "llama3.2:latest"
OLLAMA_URL = "http://localhost:11434/api/generate"

# Number of relevant chunks sent to Ollama
TOP_K = 5

# Minimum semantic similarity
SIMILARITY_THRESHOLD = 0.25


# ============================================================
# HEADER
# ============================================================

print("=" * 80)
print("INSURANCE KNOWLEDGE BASE - COMPANY FILTERED Q&A")
print("=" * 80)


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("\nLoading embedding model...")

model = SentenceTransformer(MODEL_NAME)

print("✓ Embedding model loaded.")


# ============================================================
# CONNECT TO CHROMADB
# ============================================================

print("\nConnecting to ChromaDB...")

client = chromadb.PersistentClient(
    path=str(VECTOR_DB_DIR)
)

collection = client.get_collection(
    name=COLLECTION_NAME
)

print(f"✓ Collection: {COLLECTION_NAME}")
print(f"✓ Vectors: {collection.count()}")


# ============================================================
# LOAD CHUNKS
# ============================================================

with CHUNKS_FILE.open("r", encoding="utf-8") as f:
    chunks = json.load(f)

print(f"✓ Loaded {len(chunks)} chunks.")


# ============================================================
# GET COMPANY
# ============================================================

def get_company_from_chunk(chunk):

    possible_keys = [
        "company",
        "Company",
        "company_name",
        "Company Name",
        "insurer",
        "insurer_name"
    ]

    for key in possible_keys:

        value = chunk.get(key)

        if value:
            return str(value).strip()

    metadata = chunk.get("metadata", {})

    if isinstance(metadata, dict):

        for key in possible_keys:

            value = metadata.get(key)

            if value:
                return str(value).strip()

    return None


# ============================================================
# GET UNIQUE COMPANIES
# ============================================================

def get_companies():

    companies = set()

    for chunk in chunks:

        company = get_company_from_chunk(chunk)

        if not company:
            continue

        company = " ".join(company.split())

        if "Vehicle Damage Description" in company:
            continue

        companies.add(company)

    return sorted(companies)


companies = get_companies()

print(f"\n✓ Found {len(companies)} insurance companies.")


# ============================================================
# DISPLAY COMPANIES
# ============================================================

def display_companies():

    print("\n")
    print("=" * 80)
    print("AVAILABLE INSURANCE COMPANIES")
    print("=" * 80)

    for i, company in enumerate(companies, start=1):
        print(f"{i}. {company}")

    print("\nType 'exit' to quit.")


# ============================================================
# GET CONTENT
# ============================================================

def get_content(chunk):

    content = chunk.get("content", "")

    if not content:
        content = chunk.get("text", "")

    return str(content).strip()


# ============================================================
# DOCUMENT INFORMATION
# ============================================================

def get_document_info(chunk):

    document = (
        chunk.get("document")
        or chunk.get("document_name")
        or chunk.get("file_name")
        or "Unknown"
    )

    page_start = (
        chunk.get("page_start")
        or chunk.get("start_page")
        or chunk.get("page")
        or "Unknown"
    )

    page_end = (
        chunk.get("page_end")
        or chunk.get("end_page")
        or page_start
    )

    chunk_id = (
        chunk.get("chunk_id")
        or chunk.get("id")
        or "Unknown"
    )

    return document, page_start, page_end, chunk_id


# ============================================================
# SEARCH COMPANY KNOWLEDGE BASE
# ============================================================

def search_company(company_chunks, question):

    documents = [
        get_content(chunk)
        for chunk in company_chunks
    ]

    # --------------------------------------------------------
    # EMBED QUESTION
    # --------------------------------------------------------

    query_embedding = model.encode(
        question,
        normalize_embeddings=True
    )

    # --------------------------------------------------------
    # EMBED COMPANY CHUNKS
    # --------------------------------------------------------

    chunk_embeddings = model.encode(
        documents,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    # --------------------------------------------------------
    # CALCULATE SIMILARITY
    # --------------------------------------------------------

    similarities = chunk_embeddings @ query_embedding

    # --------------------------------------------------------
    # SORT BY RELEVANCE
    # --------------------------------------------------------

    ranked_indices = similarities.argsort()[::-1]

    results = []

    for index in ranked_indices:

        similarity = float(similarities[index])

        if similarity < SIMILARITY_THRESHOLD:
            continue

        results.append(
            {
                "chunk": company_chunks[index],
                "similarity": similarity
            }
        )

        if len(results) >= TOP_K:
            break

    return results


# ============================================================
# GENERATE CUSTOM ANSWER
# ============================================================

def generate_answer(company, question, retrieved_chunks):

    context_parts = []

    for i, item in enumerate(retrieved_chunks, start=1):

        chunk = item["chunk"]

        document, page_start, page_end, chunk_id = (
            get_document_info(chunk)
        )

        content = get_content(chunk)

        context_parts.append(
            f"""
SOURCE {i}

Company:
{company}

Document:
{document}

Pages:
{page_start} - {page_end}

Chunk:
{chunk_id}

Policy Content:
{content}
"""
        )

    context = "\n".join(context_parts)

    # ========================================================
    # CUSTOM PROMPT
    # ========================================================

    prompt = f"""
You are a vehicle insurance policy assistant.

The user has selected exactly this insurance company:

{company}

The user's exact question is:

{question}

You MUST answer only using the policy information provided below.

IMPORTANT RULES:

1. Answer ONLY for {company}.
2. Do not use information from another insurance company.
3. Do not copy large paragraphs from the policy.
4. Understand the policy information and create a concise answer.
5. Answer the user's exact question directly.
6. Do not provide unrelated information.
7. Do not invent or assume anything that is not stated in the policy.
8. If the question asks about coverage, clearly state whether it is:
   - Covered
   - Not covered
   - Partially covered
   - Not clearly specified
9. If the question asks for a procedure, provide clear numbered steps.
10. If the question asks about exclusions, list only the relevant exclusions.
11. If the policy contains conditions, mention only conditions relevant to the question.
12. If the policy information is insufficient, say:
   "The available policy information does not clearly specify this."
13. Do not mention similarity scores.
14. Do not mention chunks.
15. Do not mention retrieval.
16. Do not mention the embedding model.
17. Do not mention Ollama.
18. Do not mention that you are an AI.
19. Do not answer using general insurance knowledge.
20. The answer must be based strictly on the supplied policy information.

IMPORTANT:
The answer should be CUSTOM-MADE for the exact question.

For example, if the user asks:

"What is the claim procedure?"

Do NOT return the entire policy.

Instead return something like:

Answer:
<short direct answer>

Claim Procedure:
1. ...
2. ...
3. ...

Important Conditions:
- ...
- ...

If the user asks:

"Is engine damage covered?"

Return:

Answer:
Covered / Not covered / Partially covered / Not clearly specified.

Details:
- ...
- ...

Conditions / Exclusions:
- ...

Only include sections that are relevant.

POLICY INFORMATION:
{context}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1
        }
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=120
    )

    response.raise_for_status()

    data = response.json()

    answer = data.get("response", "").strip()

    if not answer:
        return (
            "The available policy information does not clearly "
            "specify this."
        )

    return answer


# ============================================================
# MAIN PROGRAM
# ============================================================

display_companies()


while True:

    # ========================================================
    # SELECT COMPANY
    # ========================================================

    selection = input(
        "\nSelect an insurance company (enter number): "
    ).strip()

    if selection.lower() == "exit":

        print("\nGoodbye!")
        break

    try:

        company_index = int(selection)

    except ValueError:

        print("❌ Please enter a valid number.")
        continue

    if company_index < 1 or company_index > len(companies):

        print(
            f"❌ Please select a number between 1 and {len(companies)}."
        )

        continue

    selected_company = companies[company_index - 1]

    print(
        f"\n✓ Selected company: {selected_company}"
    )


    # ========================================================
    # FILTER CHUNKS BY COMPANY
    # ========================================================

    company_chunks = []

    for chunk in chunks:

        chunk_company = get_company_from_chunk(chunk)

        if not chunk_company:
            continue

        chunk_company = " ".join(chunk_company.split())

        if chunk_company.lower() == selected_company.lower():

            company_chunks.append(chunk)


    print(
        f"✓ Found {len(company_chunks)} chunks "
        f"for {selected_company}"
    )


    if not company_chunks:

        print(
            f"❌ No documents found for {selected_company}."
        )

        continue


    print("\nPreparing company knowledge base...")
    print("✓ Company knowledge base ready.")


    # ========================================================
    # QUESTION LOOP
    # ========================================================

    while True:

        question = input(
            "\nAsk your question: "
        ).strip()


        # ----------------------------------------------------
        # EXIT
        # ----------------------------------------------------

        if question.lower() == "exit":

            print("\nGoodbye!")
            raise SystemExit


        # ----------------------------------------------------
        # CHANGE COMPANY
        # ----------------------------------------------------

        if question.lower() == "change":

            print(
                "\nReturning to company selection..."
            )

            break


        # ----------------------------------------------------
        # EMPTY QUESTION
        # ----------------------------------------------------

        if not question:

            print(
                "❌ Please enter a question."
            )

            continue


        # ====================================================
        # SEARCH
        # ====================================================

        print("\nSearching policy information...")

        try:

            results = search_company(
                company_chunks,
                question
            )

        except Exception as e:

            print(
                f"\n❌ Search error: {e}"
            )

            continue


        # ====================================================
        # NO RELEVANT RESULT
        # ====================================================

        if not results:

            print("\n")
            print("=" * 80)
            print(f"ANSWER - {selected_company}")
            print("=" * 80)

            print(
                "\nThe available policy information does not "
                "clearly specify this."
            )

            continue


        # ====================================================
        # GENERATE CUSTOM ANSWER
        # ====================================================

        print("\n")
        print("=" * 80)
        print(f"GENERATING ANSWER - {selected_company}")
        print("=" * 80)


        try:

            answer = generate_answer(
                selected_company,
                question,
                results
            )


        # ----------------------------------------------------
        # OLLAMA CONNECTION ERROR
        # ----------------------------------------------------

        except requests.exceptions.ConnectionError:

            print(
                "\n❌ Cannot connect to Ollama."
            )

            print(
                "\nMake sure Ollama is running."
            )

            print(
                "\nCheck with:"
            )

            print(
                "  ollama list"
            )
            print(
                "\nThe answer could not be generated."
            )

            continue

        # ====================================================
        # OLLAMA TIMEOUT ERROR
        # ====================================================

        except requests.exceptions.Timeout:

            print("\n❌ ERROR: Ollama took too long to respond.")

            print(
                "\nThe answer could not be retrieved within "
                "the allowed time."
            )

            print(
                "\nPossible causes:"
            )

            print(
                "  - The Ollama model is taking too long."
            )

            print(
                "  - Your computer may not have enough resources."
            )

            print(
                "  - The selected model may be too slow."
            )

            print(
                "\nTry running:"
            )

            print(
                "  ollama list"
            )

            print(
                "\nThe program will continue. "
                "You can ask another question."
            )

            continue

        # ----------------------------------------------------
        # OLLAMA HTTP ERROR
        # ----------------------------------------------------

        except requests.exceptions.HTTPError as e:

            print(
                f"\n❌ Ollama error: {e}"
            )

            print(
                f"\nConfigured Ollama model:"
            )

            print(
                f"  {OLLAMA_MODEL}"
            )

            print(
                "\nCheck available models with:"
            )

            print(
                "  ollama list"
            )

            continue


        # ====================================================
        # OTHER OLLAMA / REQUEST ERROR
        # ====================================================

        except requests.exceptions.RequestException as e:

            print(
                f"\n❌ ERROR communicating with Ollama:"
            )

            print(
                f"Details: {e}"
            )

            print(
                "\nThe answer could not be generated."
            )

            continue


        # ====================================================
        # UNEXPECTED ERROR
        # ====================================================

        except Exception as e:

            print(
                f"\n❌ ERROR generating answer: {e}"
            )

            print(
                "\nThe program will continue."
            )

            continue


        # ====================================================
        # DISPLAY FINAL ANSWER
        # ====================================================

        print("\n")
        print("=" * 80)
        print(f"ANSWER - {selected_company}")
        print("=" * 80)

        print("\n")
        print(answer)

        print("\n")
        print("-" * 80)
        print("Commands:")
        print("  change  - select another insurance company")
        print("  exit    - close the program")