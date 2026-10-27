export default function Story({ headline, story, pic }: { headline: string; story: string; pic?: string | null }) {
    return (
        <article className="story">
            <h1 className="headline">{headline}</h1>
            {pic && <img className="story-pic" src={pic} alt={headline} />}
            {story.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
            ))}
        </article>
    );
}
