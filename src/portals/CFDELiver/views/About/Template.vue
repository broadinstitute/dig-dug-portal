<template>
    <div class="main">
        <div v-if="$parent.pageContent" class="main-content">
            <div class="f-col" style="gap:40px; background-color: #fff; width:100%;">
                <div class="section" style="padding:0; overflow:clip; border-radius: 40px;">
                    <div class="f-row" style="flex-direction: row-reverse;">
                        <div class="f-col align-v-center" style="flex: 1; max-width:50%; gap:10px; padding:40px; background: var(--cfde-blue); color: white; height:400px; z-index: 1">
                            <div v-html="$parent.pageContentAbout"></div>
                            <div v-html="$parent.pageContentGovernance"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>