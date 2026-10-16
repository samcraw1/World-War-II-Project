export default function Story({ headline, story }: { headline: string; story: string }) {
    return (
        <article className="story">
            <h1 className="headline">{headline}</h1>
            {story.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
            ))}
        </article>
    );
}
