import json
import os
import argparse
from datetime import datetime

def parse_chatgpt(input_file, output_dir):
    """
    Parses a ChatGPT JSON export and creates individual Markdown files.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for conversation in data:
        title = conversation.get('title', 'Untitled Conversation')
        create_time = conversation.get('create_time')
        date_str = datetime.fromtimestamp(create_time).strftime('%Y-%m-%d') if create_time else 'Unknown Date'
        
        # Sanitize filename
        safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).rstrip()
        filename = f"{date_str} - {safe_title}.md"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as out:
            out.write(f"---\n")
            out.write(f"title: \"{title}\"\n")
            out.write(f"date: {date_str}\n")
            out.write(f"source: ChatGPT\n")
            out.write(f"---\n\n")
            out.write(f"# {title}\n\n")
            
            mapping = conversation.get('mapping', {})
            for node_id in mapping:
                node = mapping[node_id]
                message = node.get('message')
                if message and message.get('content'):
                    author = message.get('author', {}).get('role', 'unknown')
                    content_parts = message.get('content', {}).get('parts', [])
                    for part in content_parts:
                        if isinstance(part, str):
                            out.write(f"### {author.capitalize()}\n{part}\n\n")

    print(f"Successfully processed {len(data)} conversations.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChatGPT Export Parser")
    parser.add_argument("--input", required=True, help="Path to conversations.json")
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()
    
    parse_chatgpt(args.input, args.output)
