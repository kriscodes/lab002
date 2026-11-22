import { TalkingFaces } from '../components/talking-faces';

export default function Home() {
  return (
    <main className="lab">
      <header className="lab-header">
        <span className="lab-id">LAB002</span>
        <span>Facial animation study</span>
      </header>
      <div className="intro">
        <h1>One voice, three faces.</h1>
        <p>
          How much of a face do you need to hear a character? Play the scene and switch faces as
          Mira speaks.
        </p>
      </div>
      <TalkingFaces />
    </main>
  );
}
