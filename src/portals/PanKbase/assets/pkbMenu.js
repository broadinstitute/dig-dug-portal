export const pkbMenu = {
    highlightItems: [
        { label: "PanKgraph", path: "https://pankgraph.org/" },
        { label: "Integrated Cell Browser", path: "/single-cell.html" }
    ],
    menuItems: [
        {
            label: "Data",
            path: "",
            subMenuItems: [
                {
                    label: "Donor Summary",
                    path: "/donor-metadata.html",
                },
                { label: "Data Library", path: "https://data.pankbase.org" },
                { label: "APIs", path: "/apis.html" },
            ],
        },
        {
            label: "Resources",
            path: "",
            subMenuItems: [
                { label: "Integrated Cell Browser", path: "/single-cell.html" },
                { label: "Differential Gene Expression Browser", path: "/diff-exp.html" },
                { label: "PCA Explorer", path: "/pca-explorer.html" },
                {
                    label: "Analytical Library",
                    path: "/analytical-library.html",
                },
                {
                    label: "Metadata Standards",
                    path: "/metadata-data-standards.html",
                },
                { label: "Tools | Pipelines", path: "/tools-pipelines.html" },
                { label: "Publications", path: "/publications.html" },
            ],
        },
        {
            label: "About",
            path: "",
            subMenuItems: [
                { label: "PanKbase Program", path: "/projects.html" },
                { label: "People", path: "/people.html" },
                { label: "Policies", path: "/policies.html" },
                { label: "Related Programs", path: "/programs.html" },
                { label: "Collaborate", path: "/collaborate.html" },
                { label: "Funding Opportunities", path: "/funding.html" },
            ],
        },
        {
            label: "Help",
            path: "",
            subMenuItems: [
                { label: "Contact | Feedback", path: "/contact.html" },
                { label: "Tutorials", path: "/tutorials.html" },
                { label: "GitHub", path: "https://github.com/PanKbase"},
                { label: "News", path: "/news.html" },
            ],
        },
    ],
};
