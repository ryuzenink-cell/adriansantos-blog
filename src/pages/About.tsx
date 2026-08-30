import { Layout } from '../components/Layout';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getLanguagePreference } from '../utils/languagePreference';
import { PROFESSIONAL_GITHUB_URL, YOROKOBI_STUDIO_URL } from '../utils/links';
import type { Language } from '../types';

const COPY = {
  en: {
    title: 'About',
    description: 'About Adrian Santos, his software engineering studies, technical writing, and projects.',
    intro: 'I am Adrian Santos. I study and work with Software Engineering, build projects, and write about what I learn along the way.',
    purpose: 'I use this blog as a practical record of studies, technical decisions, career development, and the projects that turn ideas into working software.',
    section: 'What you will find here',
    topics: [
      'Software engineering and architecture notes',
      'Technical studies and lessons learned',
      'Project write-ups and implementation decisions',
      'Reflections on career development and professional practice',
    ],
    collaboration: 'Projects and collaboration',
    studio: 'I also take part in Yorokobi Studio, a game studio focused on creating visual novels. It is where software, narrative, and interactive experiences meet in a different kind of project.',
    connect: 'Professional links',
    github: 'Professional GitHub',
    githubLabel: 'Adrian Santos professional GitHub profile (opens in a new tab)',
    yorokobiLabel: 'Yorokobi Studio website (opens in a new tab)',
  },
  pt: {
    title: 'Sobre',
    description: 'Sobre Adrian Santos, seus estudos em Engenharia de Software, artigos técnicos e projetos.',
    intro: 'Sou Adrian Santos. Estudo e trabalho com Engenharia de Software, desenvolvo projetos e escrevo sobre o que aprendo durante esse processo.',
    purpose: 'Uso este blog como um registro prático de estudos, decisões técnicas, desenvolvimento de carreira e projetos que transformam ideias em software funcional.',
    section: 'O que você encontra aqui',
    topics: [
      'Anotações sobre Engenharia de Software e arquitetura',
      'Estudos técnicos e aprendizados',
      'Relatos de projetos e decisões de implementação',
      'Reflexões sobre carreira e prática profissional',
    ],
    collaboration: 'Projetos e colaboração',
    studio: 'Também participo do Yorokobi Studio, um estúdio de games voltado à criação de visual novels. É um espaço em que software, narrativa e experiências interativas se encontram em outro tipo de projeto.',
    connect: 'Links profissionais',
    github: 'GitHub profissional',
    githubLabel: 'GitHub profissional de Adrian Santos (abre em uma nova aba)',
    yorokobiLabel: 'Site do Yorokobi Studio (abre em uma nova aba)',
  },
} satisfies Record<Language, {
  title: string;
  description: string;
  intro: string;
  purpose: string;
  section: string;
  topics: string[];
  collaboration: string;
  studio: string;
  connect: string;
  github: string;
  githubLabel: string;
  yorokobiLabel: string;
}>;

export function About() {
  const language = getLanguagePreference().interfaceLanguage;
  const copy = COPY[language];

  useDocumentMeta({
    title: `${copy.title} | AdrianSantos.blog`,
    description: copy.description,
    canonicalPath: '/about',
    language,
  });

  return (
    <Layout language={language}>
      <article className="prose prose--page profile-page">
        <h1>{copy.title}</h1>
        <p className="profile-page__lead">{copy.intro}</p>
        <p>{copy.purpose}</p>

        <h2>{copy.section}</h2>
        <ul>
          {copy.topics.map((topic) => <li key={topic}>{topic}</li>)}
        </ul>

        <h2>{copy.collaboration}</h2>
        <p>{copy.studio}</p>

        <h2>{copy.connect}</h2>
        <div className="profile-actions">
          <a
            href={PROFESSIONAL_GITHUB_URL}
            className="btn btn--primary"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.githubLabel}
          >
            {copy.github} <span aria-hidden="true">↗</span>
          </a>
          <a
            href={YOROKOBI_STUDIO_URL}
            className="btn btn--ghost"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.yorokobiLabel}
          >
            Yorokobi Studio <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    </Layout>
  );
}
