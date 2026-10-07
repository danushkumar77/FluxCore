import re
import math
from typing import List, Dict, Any, Tuple

class SimpleVectorSearch:
    def __init__(self):
        pass

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        return [w for w in text.split() if len(w) > 2]

    @staticmethod
    def _term_frequency(tokens: List[str]) -> Dict[str, float]:
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0.0) + 1.0
        # Normalize
        total = len(tokens)
        if total > 0:
            for token in tf:
                tf[token] /= total
        return tf

    def search(self, query: str, documents: List[Dict[str, Any]], top_n: int = 3) -> List[Tuple[float, Dict[str, Any]]]:
        if not documents:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return [(0.0, doc) for doc in documents[:top_n]]

        # Tokenize documents
        doc_tokens_list = [self._tokenize(doc.get("description", "") + " " + doc.get("root_cause", "")) for doc in documents]
        
        # Build vocabulary
        vocab = set(query_tokens)
        for d_tok in doc_tokens_list:
            vocab.update(d_tok)
        
        # Compute IDF
        num_docs = len(documents)
        idf = {}
        for term in vocab:
            docs_with_term = sum(1 for d_tok in doc_tokens_list if term in d_tok)
            # Add smoothing
            idf[term] = math.log((num_docs + 1) / (docs_with_term + 1)) + 1.0

        # Query vector
        query_tf = self._term_frequency(query_tokens)
        query_vector = {term: query_tf.get(term, 0.0) * idf[term] for term in query_tokens}
        
        # Doc vectors & cosine similarity
        results = []
        for doc, doc_tokens in zip(documents, doc_tokens_list):
            doc_tf = self._term_frequency(doc_tokens)
            doc_vector = {term: doc_tf.get(term, 0.0) * idf[term] for term in doc_tokens}
            
            # Cosine similarity
            dot_product = 0.0
            for term in query_vector:
                if term in doc_vector:
                    dot_product += query_vector[term] * doc_vector[term]
            
            query_norm = math.sqrt(sum(val**2 for val in query_vector.values()))
            doc_norm = math.sqrt(sum(val**2 for val in doc_vector.values()))
            
            similarity = 0.0
            if query_norm > 0 and doc_norm > 0:
                similarity = dot_product / (query_norm * doc_norm)
            
            results.append((similarity, doc))
        
        # Sort by similarity descending
        results.sort(key=lambda x: x[0], reverse=True)
        return results[:top_n]
