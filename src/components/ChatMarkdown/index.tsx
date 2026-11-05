import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMarkdownProps } from "../../types/ai";

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="chatbot-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: () => null,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
