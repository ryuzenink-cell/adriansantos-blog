import { Layout } from '../components/Layout';

/** Página About — texto provisório em inglês, visual minimalista. */
export function About() {
  return (
    <Layout>
      <article className="prose prose--page">
        <h1>About</h1>
        <p>
          Hi, I'm <strong>Adrian Santos</strong>. I'm a software engineer who enjoys building
          small, focused tools and writing about the craft of making software.
        </p>
        <p>
          This blog is a quiet corner of the internet where I keep notes on engineering,
          side projects and the occasional experiment. No tracking, no clutter — just text.
        </p>
        <h2>What you'll find here</h2>
        <ul>
          <li>Notes on software engineering and architecture</li>
          <li>Write-ups of personal projects</li>
          <li>Experiments with new tools and languages</li>
        </ul>
        <h2>Get in touch</h2>
        <p>
          You can find my code on{' '}
          <a href="https://github.com/adriansantos" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          . Thanks for reading.
        </p>
        <p className="muted">
          <em>This is placeholder text for the first version of the blog.</em>
        </p>
      </article>
    </Layout>
  );
}
