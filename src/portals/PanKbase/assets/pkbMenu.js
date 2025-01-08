export const pkbMenu = {
    highlightItems: [
        { label: 'PanKgraph',               path: 'https://dev.pankgraph.org/' },
        { label: 'Integrated Cell Browser', path: '/single-cell.html' }
    ],
    menuItems: [
        { 
            label: 'Data', path: '', 
            subMenuItems: [
                { label: 'Donor Summary', path: '/donor-metadata.html' },
                { label: 'Data Browser', path: 'https://data.pankbase.org' },
                { label: 'APIs',         path: '/apis.html' }
            ] 
        },{ 
            label: 'Resources', path: '', 
            subMenuItems: [
                { label: 'Integrated Cell Browser', path: '/single-cell.html' },
                { label: 'Analytical Library',      path: '/analytical-library.html' },
                { label: 'Publications',            path: '/publications.html' }
            ] 
        },{ 
            label: 'About', path: '', 
            subMenuItems: [
                { label: 'Project',     path: '/projects.html' },
                { label: 'People',      path: '/people.html' },
                { label: 'Policies',    path: '/policies.html' },
                { label: 'Programs',    path: '/programs.html' },
                { label: 'Collaborate', path: '/collaborate.html' }
            ]
        },{ 
            label: 'Help', path: '', 
            subMenuItems: [
                { label: 'Contact',                   path: '/contact.html' },
                { label: 'Metadata | Data Standards', path: '/metadata-data-standards.html' },
                { label: 'Tools | Pipelines',         path: '/tools-pipelines.html' },
                { label: 'Tutorials',                 path: '/tutorials.html' },
                { label: 'News',                      path: '/news.html' }
            ]
        }
    ],
} 