import json
from pathlib import Path

from sentence_transformers import SentenceTransformer


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CHUNKS_FILE = (
    BASE_DIR
    / "processed"
    / "chunks"
    / "all_chunks.json"
)

MODEL_NAME = "all-MiniLM-L6-v2"

TOP_K = 5
SIMILARITY_THRESHOLD = 0.25


# ============================================================
# TEST QUESTIONS
# ============================================================

TEST_QUESTIONS = [
    "What is covered under own damage?",
    "What is the personal accident cover for owner driver?",
    "What are the general exclusions?",
    "What is zero depreciation?",
    "What is roadside assistance?",
    "What is the claim procedure?",
    "What documents are required for a claim?",
    "Is engine damage covered?",
    "What is the voluntary deductible?",
    "What happens in case of total loss?",
]


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("\nLoading embedding model...")

model = SentenceTransformer(MODEL_NAME)

print("✓ Embedding model loaded.")


# ============================================================
# LOAD CHUNKS
# ============================================================

print("\nLoading knowledge base...")

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
        "insurer_name",
    ]

    # Check top-level fields
    for key in possible_keys:
        value = chunk.get(key)

        if value:
            return str(value).strip()

    # Check metadata
    metadata = chunk.get("metadata", {})

    if isinstance(metadata, dict):
        for key in possible_keys:
            value = metadata.get(key)

            if value:
                return str(value).strip()

    return None


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
# GET UNIQUE COMPANIES
# ============================================================

def get_companies():

    companies = set()

    for chunk in chunks:

        company = get_company_from_chunk(chunk)

        if not company:
            continue

        company = " ".join(company.split())

        # Ignore accidental company-like entries
        if "Vehicle Damage Description" in company:
            continue

        companies.add(company)

    return sorted(companies)


# ============================================================
# SEARCH COMPANY KNOWLEDGE BASE
# ============================================================

def search_company(company_chunks, question, top_k=TOP_K):

    if not company_chunks:
        return []

    documents = [
        get_content(chunk)
        for chunk in company_chunks
    ]

    # Remove empty documents
    valid_items = [
        (chunk, content)
        for chunk, content in zip(company_chunks, documents)
        if content
    ]

    if not valid_items:
        return []

    valid_chunks = [item[0] for item in valid_items]
    documents = [item[1] for item in valid_items]

    # --------------------------------------------------------
    # EMBED QUESTION
    # --------------------------------------------------------

    query_embedding = model.encode(
        question,
        normalize_embeddings=True,
    )

    # --------------------------------------------------------
    # EMBED CHUNKS
    # --------------------------------------------------------

    chunk_embeddings = model.encode(
        documents,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    # --------------------------------------------------------
    # COSINE SIMILARITY
    # --------------------------------------------------------

    similarities = chunk_embeddings @ query_embedding

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    ranked_indices = similarities.argsort()[::-1]

    results = []

    for index in ranked_indices:

        similarity = float(similarities[index])

        if similarity < SIMILARITY_THRESHOLD:
            continue

        results.append(
            {
                "chunk": valid_chunks[index],
                "similarity": similarity,
            }
        )

        if len(results) >= top_k:
            break

    return results


# ============================================================
# SEARCH ALL COMPANIES
# ============================================================

def search_all_companies(question, top_k=TOP_K):

    all_results = []

    companies = get_companies()

    for company in companies:

        company_chunks = []

        for chunk in chunks:

            chunk_company = get_company_from_chunk(chunk)

            if not chunk_company:
                continue

            chunk_company = " ".join(
                chunk_company.split()
            )

            if chunk_company.lower() == company.lower():
                company_chunks.append(chunk)

        results = search_company(
            company_chunks,
            question,
            top_k=top_k,
        )

        for result in results:

            chunk = result["chunk"]

            document, page_start, page_end, chunk_id = (
                get_document_info(chunk)
            )

            all_results.append(
                {
                    "company": company,
                    "document": document,
                    "page_start": page_start,
                    "page_end": page_end,
                    "chunk_id": chunk_id,
                    "similarity": result["similarity"],
                    "distance": 1.0 - result["similarity"],
                    "chunk": chunk,
                }
            )

    # --------------------------------------------------------
    # GLOBAL SORT
    # --------------------------------------------------------

    all_results.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return all_results[:top_k]


# ============================================================
# DISPLAY RESULT
# ============================================================

def display_result(number, question, results):

    print("\n" + "-" * 80)
    print(f"TEST {number}/{len(TEST_QUESTIONS)}")
    print("-" * 80)

    print(f"Question: {question}")

    if not results:

        print("✗ No relevant results found")

        return False

    print(
        f"✓ Retrieval successful "
        f"({len(results)} result(s))"
    )

    best = results[0]

    print("\nBEST MATCH")
    print("-" * 80)

    print(f"Company   : {best['company']}")
    print(f"Document  : {best['document']}")
    print(
        f"Pages     : "
        f"{best['page_start']}-{best['page_end']}"
    )
    print(f"Chunk     : {best['chunk_id']}")
    print(f"Similarity: {best['similarity']:.4f}")
    print(f"Distance  : {best['distance']:.4f}")

    print("\nTOP RESULTS")
    print("-" * 80)

    for rank, result in enumerate(results, start=1):

        print(
            f"{rank}. "
            f"{result['company']} | "
            f"{result['document']} | "
            f"pages {result['page_start']}-"
            f"{result['page_end']} | "
            f"similarity={result['similarity']:.4f}"
        )

    return True


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 80)
    print("INSURANCE RETRIEVAL EVALUATION")
    print("=" * 80)

    companies = get_companies()

    print(
        f"\n✓ Found {len(companies)} insurance companies."
    )

    for company in companies:
        print(f"  - {company}")

    print("\nStarting retrieval evaluation...")

    total = len(TEST_QUESTIONS)
    passed = 0

    for number, question in enumerate(
        TEST_QUESTIONS,
        start=1,
    ):

        try:

            results = search_all_companies(
                question,
                top_k=TOP_K,
            )

            if display_result(
                number,
                question,
                results,
            ):
                passed += 1

        except Exception as e:

            print("\n" + "-" * 80)
            print(f"TEST {number}/{total}")
            print("-" * 80)

            print(f"Question: {question}")
            print(f"✗ Evaluation error: {e}")

    # ========================================================
    # SUMMARY
    # ========================================================

    print("\n" + "=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)

    print(f"Tests passed : {passed}/{total}")
    print(
        f"Tests failed : "
        f"{total - passed}/{total}"
    )

    if passed == total:
        print("\nRESULT: PASS")
    else:
        print("\nRESULT: CHECK REQUIRED")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
