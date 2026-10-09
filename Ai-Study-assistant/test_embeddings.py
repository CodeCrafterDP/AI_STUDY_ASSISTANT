from backend.rag import embed_text


text = "What is a database management system?"

vector = embed_text(text)

print("Embedding created successfully")
print("Vector type:", type(vector))
print("Vector dimensions:", len(vector))
print("First 10 values:", vector[:10])