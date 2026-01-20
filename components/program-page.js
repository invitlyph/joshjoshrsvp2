// Josh & Joy Program Page
// Data pulled from the ceremony timetable + LFEM proposed program PDFs.

const PREPARATION_TIMELINE = [
  {
    time: '5:00 - 6:00 AM',
    title: 'Wake Up Call',
    tasks: [
      { title: 'Wake up call of the bride and groom', owner: 'Groom & Bride' },
      { title: 'Shower and breakfast of the couple', owner: 'Groom & Bride' }
    ]
  },
  {
    time: '7:30 - 9:30 AM',
    title: 'Hair & Makeup Call',
    tasks: [
      { title: 'Call time for HMUA', owner: 'HMUA team' },
      { title: 'Start of makeup for the bride', owner: 'Bride + HMUA' },
      { title: 'Light makeup for the groom', owner: 'HMUA' }
    ]
  },
  {
    time: '9:30 - 10:30 AM',
    title: 'Wedding Party Check-in',
    tasks: [
      { title: 'Call time for bridesmaids', owner: 'Bridesmaids' },
      { title: 'Arrival of coordinators', owner: 'Event coordinators' }
    ]
  },
  {
    time: '10:30 - 11:30 AM',
    title: 'Creative Team Arrives',
    tasks: [
      { title: 'Call time for photographer and videographer', owner: 'Photo + video team' },
      { title: 'Start of detail shoot for the bride and groom', owner: 'Photo + video team' }
    ]
  },
  {
    time: '11:30 AM - 12:30 PM',
    title: 'Groom Portraits',
    tasks: [
      { title: 'Call time for groomsmen', owner: 'Groomsmen' },
      { title: 'Photo/video of the groom with groomsmen (first look)', owner: 'Photo + video team' },
      { title: 'Prep shoot of the groom', owner: 'Photo + video team' }
    ]
  },
  {
    time: '12:30 - 1:30 PM',
    title: 'Bride Portraits',
    tasks: [
      { title: 'Photo/video of the bride with bridesmaids (first look)', owner: 'Photo + video team' },
      { title: 'Prep shoot of the bride', owner: 'Photo + video team' }
    ]
  },
  {
    time: '1:30 - 2:00 PM',
    title: 'Formal Attire Shoots',
    tasks: [
      { title: 'Prep shoot of the groom wearing his suit', owner: 'Groom + Best Man' },
      { title: 'Formal portraits of groom with groomsmen', owner: 'Photo + video team' },
      { title: 'Prep shoot of the bride wearing her gown', owner: 'Bride + Maid of Honor' },
      { title: 'Formal portraits of bride with bridesmaids', owner: 'Photo + video team' }
    ]
  },
  {
    time: '2:00 - 2:15 PM',
    title: 'Quick Break',
    tasks: [
      { title: 'Lunch + touch-ups', owner: 'Entire entourage & HMUA' }
    ]
  },
  {
    time: '2:15 PM',
    title: 'Family Portraits',
    tasks: [
      { title: 'Call time for the couple\'s parents', owner: 'Immediate family' },
      { title: 'Gift giving & family portraits', owner: 'Photo + video team' }
    ]
  },
  {
    time: '2:30 - 3:00 PM',
    title: 'Travel & Ceremony',
    tasks: [
      { title: 'Groom\'s departure going to church', owner: 'Groom\'s party' },
      { title: 'Wedding entourage + guests depart for church', owner: 'Groomsmen & Bridesmaids' },
      { title: 'Bride\'s departure going to church', owner: 'Bride\'s party' },
      { title: 'Start of the ceremony', owner: 'Entire entourage' }
    ]
  },
  {
    time: '4:30 - 6:20 PM',
    title: 'Post Ceremony',
    tasks: [
      { title: 'End of ceremony & post-nuptial shoot', owner: 'Groom, Bride & Photo Team' },
      { title: 'Couple\'s preparation for reception program', owner: 'Couple + HMUA' },
      { title: 'Reception program begins (host + entourage)', owner: 'Wedding entourage & host' }
    ]
  }
];

const PROGRAM_SECTIONS = [
  {
    title: 'At The Ceremony',
    steps: [
      'Processional',
      'Best man walk of the groom with parents',
      'Entrance of the bridal entourage',
      'Principal sponsors',
      'Bearers',
      'Secondary sponsors',
      'Best man and groomsmen',
      'Little groom and little bride',
      'Maid of honor + parents of the bride',
      'Walk of the bride',
      'Wedding rites and exchange of vows',
      'Offertory',
      'Communion',
      'Photo op & recessional with wedding wands'
    ]
  },
  {
    title: 'Before Reception',
    steps: [
      'Couple\'s meal',
      'Retouch',
      'Change outfit (if any)',
      'Photobooth session (if any)'
    ]
  },
  {
    title: 'Reception Highlights',
    steps: [
      'Arrival of guests',
      'First set of band (if any)',
      'Opening of cocktails, pica-pica, and photobooth',
      'Mabuhay / coordinators\' showmanship about the event',
      'Preshow games + energizers (c/o coordinators)',
      'Mob dance tutorial (c/o coordinators)',
      'Entrance of the host',
      'Introduction + entrance of principal sponsors',
      'Parents of the couple',
      'Secondary sponsors',
      'Team Bride',
      'Team Groom',
      'Grand entrance of the couple',
      {
        title: 'Wedding traditions (dances)',
        details: [
          'Mother-son dance',
          'Father-daughter dance',
          'First dance of the couple'
        ]
      },
      'Cutting of cake',
      'Wine toasting by maid of honor & best man',
      'Releasing of doves',
      'Prayer before meal',
      'Monetary dance',
      'Meal time',
      'Picture taking per table'
    ]
  },
  {
    title: 'After-Party Notes',
    steps: [
      'Tagayan',
      'Table hopping',
      'Second set of band / intermission number (if any)',
      {
        title: 'Messages',
        details: [
          'Ninong & Ninang (1-2 pairs)',
          'Parents of the bride'
        ]
      },
      'Bachelor\'s game (c/o host)',
      'Playback SDE (if any)',
      'Couple\'s message (suppliers, friends, relatives, entourage, parents)',
      'Ending kiss',
      'Socialization / party',
      'Third set of band'
    ]
  }
];

function createTaskList(tasks = []) {
  if (!tasks.length) return '';
  return `
    <ul class="task-list">
      ${tasks.map(task => `
        <li>
          <span>${task.title}</span>
          ${task.owner ? `<small>${task.owner}</small>` : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

function renderPreparationTimeline() {
  const container = document.getElementById('prepTimeline');
  if (!container) return;

  container.innerHTML = PREPARATION_TIMELINE.map(entry => `
    <article class="prep-card">
      <div class="prep-time">${entry.time}</div>
      <h3>${entry.title}</h3>
      ${createTaskList(entry.tasks)}
    </article>
  `).join('');
}

function renderProgramSections() {
  const container = document.getElementById('programSections');
  if (!container) return;

  container.innerHTML = PROGRAM_SECTIONS.map(section => `
    <article class="program-section-card">
      <h3>${section.title}</h3>
      <ol class="program-steps">
        ${section.steps.map(step => {
          if (typeof step === 'string') {
            return `<li>${step}</li>`;
          }
          return `
            <li>
              ${step.title}
              <ul class="step-details">
                ${step.details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            </li>
          `;
        }).join('')}
      </ol>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderPreparationTimeline();
  renderProgramSections();
});
