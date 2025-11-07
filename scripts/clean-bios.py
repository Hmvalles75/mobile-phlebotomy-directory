import csv
import re

def clean_bio(bio):
    if not bio:
        return bio
    
    # Remove excessive emoji repetition (more than 3 of the same character in a row)
    bio = re.sub(r'(.)\1{3,}', r'\1\1\1', bio)
    
    # Remove repetitive sentence patterns
    sentences = [s.strip() for s in re.split(r'[.!?]+', bio) if s.strip()]
    cleaned_sentences = []
    seen = {}
    
    for sentence in sentences:
        # Track how many times we've seen this sentence
        if sentence not in seen:
            seen[sentence] = 0
        seen[sentence] += 1
        
        # Only keep up to 2 repetitions
        if seen[sentence] <= 2:
            cleaned_sentences.append(sentence)
    
    bio = '. '.join(cleaned_sentences)
    
    # Truncate if too long (max 800 chars for readability)
    if len(bio) > 800:
        bio = bio[:797] + '...'
    
    return bio.strip()

# Read and clean CSV
rows = []
with open('cleaned_providers.csv', 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    
    for row in reader:
        if 'bio' in row:
            original_length = len(row['bio']) if row['bio'] else 0
            row['bio'] = clean_bio(row['bio'])
            new_length = len(row['bio']) if row['bio'] else 0
            
            if original_length > new_length + 100:
                print(f"Cleaned {row['name']}: {original_length} -> {new_length} chars")
        
        rows.append(row)

# Write cleaned CSV
with open('cleaned_providers.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\n✅ Processed {len(rows)} providers")
print("   - Removed excessive emoji repetitions")
print("   - Removed repetitive sentences")
print("   - Truncated overly long bios")
