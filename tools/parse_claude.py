import json
import os
import argparse
from datetime import datetime

def parse_claude(input_file, output_dir):
    """
    Parses a Claude JSON export and creates individual Markdown files.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for conversation in data:
        title = conversation.get('name', 'Untitled Conversation')
        create_time_str = conversation.get('created_at')
        
        try:
            # Parse ISO format datetime
            dt = datetime.fromisoformat(create_time_str.replace('Z', '+00:00'))
            date_str = dt.strftime('%Y-%m-%d')
        except:
            date_str = 'Unknown Date'
            
        # Sanitize filename
        safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).rstrip()
        filename = f"{date_str} - {safe_title}.md"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as out:
            out.write(f"---\n")
            out.write(f"title: \"{title}\"\n")
            out.write(f"date: {date_str}\n")
            out.write(f"source: Claude\n")
            out.write(f"---\n\n")
            out.write(f"# {title}\n\n")
            
            messages = conversation.get('chat_messages', [])
            for message in messages:
                sender = message.get('sender', 'unknown')
                text = message.get('text', '')
                if text:
                    out.write(f"### {sender.capitalize()}\n{text}\n\n")

    print(f"Successfully processed {len(data)} conversations.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Claude Export Parser")
    parser.add_argument("--input", required=True, help="Path to conversations.json")
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()
    
    parse_claude(args.input, args.output)
