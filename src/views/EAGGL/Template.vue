<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :rawPhenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <!-- Page title -->
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>EAGGL (What EAGGL stands for)</h2>
                    </div>
                </div>
            </div>

            <!-- Method summary -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <b-tabs content-class="mt-3">
                        <b-tab title="Abstract" active>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut
                                enim ad minim veniam, quis nostrud exercitation
                                ullamco laboris nisi ut aliquip ex ea commodo
                                consequat. Duis aute irure dolor in
                                reprehenderit in voluptate velit esse cillum
                                dolore eu fugiat nulla pariatur.
                            </p>
                            <div class="method-placeholder method-placeholder-infographic">
                                Infographic
                            </div>
                        </b-tab>
                        <b-tab title="Documentation">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut
                                enim ad minim veniam, quis nostrud exercitation
                                ullamco laboris nisi ut aliquip ex ea commodo
                                consequat.
                            </p>
                            <div class="method-placeholder method-placeholder-plot">
                                Plot
                            </div>
                            <p>
                                Duis aute irure dolor in reprehenderit in
                                voluptate velit esse cillum dolore eu fugiat
                                nulla pariatur. Excepteur sint occaecat
                                cupidatat non proident, sunt in culpa qui
                                officia deserunt mollit anim id est laborum.
                            </p>
                            <div class="method-placeholder method-placeholder-plot">
                                Plot
                            </div>
                            <p>
                                Sed ut perspiciatis unde omnis iste natus error
                                sit voluptatem accusantium doloremque
                                laudantium, totam rem aperiam, eaque ipsa quae
                                ab illo inventore veritatis et quasi architecto
                                beatae vitae dicta sunt explicabo.
                            </p>
                            <div class="method-placeholder method-placeholder-plot">
                                Plot
                            </div>
                            <p>
                                Nemo enim ipsam voluptatem quia voluptas sit
                                aspernatur aut odit aut fugit, sed quia
                                consequuntur magni dolores eos qui ratione
                                voluptatem sequi nesciunt. Neque porro quisquam
                                est, qui dolorem ipsum quia dolor sit amet.
                            </p>
                            <p>
                                At vero eos et accusamus et iusto odio
                                dignissimos ducimus qui blanditiis praesentium
                                voluptatum deleniti atque corrupti quos dolores
                                et quas molestias excepturi sint occaecati
                                cupiditate non provident.
                            </p>
                        </b-tab>
                        <b-tab title="User guide">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua. Ut
                                enim ad minim veniam, quis nostrud exercitation
                                ullamco laboris nisi ut aliquip ex ea commodo
                                consequat.
                            </p>
                            <div class="method-placeholder method-placeholder-image">
                                Image
                            </div>
                            <p>
                                Duis aute irure dolor in reprehenderit in
                                voluptate velit esse cillum dolore eu fugiat
                                nulla pariatur. Excepteur sint occaecat
                                cupidatat non proident, sunt in culpa qui
                                officia deserunt mollit anim id est laborum.
                            </p>
                            <div class="method-placeholder method-placeholder-image">
                                Image
                            </div>
                            <p>
                                Sed ut perspiciatis unde omnis iste natus error
                                sit voluptatem accusantium doloremque
                                laudantium, totam rem aperiam, eaque ipsa quae
                                ab illo inventore veritatis et quasi architecto
                                beatae vitae dicta sunt explicabo.
                            </p>
                            <div class="method-placeholder method-placeholder-image">
                                Image
                            </div>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>

            <!-- Feature(s) -->
            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="text-center">
                        <img
                            class="img-fluid"
                            src="https://hugeampkpncms.org/sites/default/files/images/EAGGL.png"
                            alt="EAGGL"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
.method-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1.25rem 0;
    color: #666;
    background: #f4f4f4;
    border: 1px dashed #ccc;
    border-radius: 4px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.method-placeholder-infographic {
    min-height: 180px;
}

.method-placeholder-plot {
    min-height: 240px;
}

.method-placeholder-image {
    width: 500px;
    height: 300px;
    margin-left: auto;
    margin-right: auto;
}
</style>
