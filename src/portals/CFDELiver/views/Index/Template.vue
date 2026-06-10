<template>
    <div class="main">
        <div v-if="$parent.pageContent" class="main-content">
            <div class="f-col" style="gap:40px; background-color: #fff; width:100%;">
                <div class="section" style="padding:0; overflow:clip; border-radius: 40px;">
                    <div class="f-row" style="flex-direction: row-reverse;">
                        <div class="f-row fill-width align-v-center" style="max-width:50%; padding:40px; position: relative; justify-content: center; background: var(--cfde-lite-blue);">
                            <img src="https://hugeampkpncms.org/sites/default/files/images/cfde_tissues/cfde.png" style="position: absolute; width:35vw; left: -17%; opacity: .5; mix-blend-mode: luminosity;"/>
                            <img src="https://hugeampkpncms.org/sites/default/files/images/cfde_tissues/liver.png" style="width: 25vw; height:auto; max-width: 300px; z-index: 1; filter: drop-shadow(0px 0px 6px rgba(0, 0, 0, 0.5));"/>
                        </div>
                        <div class="f-col align-v-center" style="flex: 1; max-width:50%; gap:10px; padding:40px; background: var(--cfde-blue); color: white; height:400px; z-index: 1">
                            <h1 class="hero-title">{{ $parent.pageContent.hero.title }}</h1>
                            <div class="hero-body">{{ $parent.pageContent.hero.subtitle }}</div>
                        </div>
                    </div>
                </div>
                <div class="f-row" style="max-width: 800px; width:100%; margin:0 auto; gap:10px">
                    <input class="lg fill-width" placeholder="Search gene" />
                    <button class="lg" style="width: 100px;" disabled>Search</button>
                </div>
                <div class="sections f-col" style="gap:50px; margin: 0 0 50px;">

                    <div v-for="section in $parent.pageContent.sections" class="section f-col" style="gap:20px">
                        <div>
                            <h3>{{ section.title }}</h3>
                            <div class="section-subtitle">{{ section.subtitle }}</div>
                        </div>
                        <div class="f-row fill-children" style="flex-wrap: wrap; gap: 20px">
                            <a v-for="card in section.cards" 
                                class="section-card f-col"
                                :class="{'coming-soon': card.link==='#'}"
                                :href="card.link"
                            >
                                <div class="img">
                                    <img v-if="card.image" :src="card.image" />
                                </div>
                                <div class="section-card-info f-col">
                                    <h4>{{ card.title }}</h4>
                                    <div class="section-card-body">{{ card.body }}</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="$parent.pageContent?.support" class="supported">
            <div class="main-content f-col" style="gap:20px">
                <div>
                    <h3>{{ $parent.pageContent.support.title }}</h3>
                    <div class="section-subtitle">{{ $parent.pageContent.support.subtitle }}</div>
                </div>
                <div class="f-row align-h-center" style="gap:20px; flex-wrap: wrap;">
                    <a v-for="image in $parent.pageContent.support.images" class="support-item" :href="image.link || null" target="_blank">
                        <img :src="image.src" />
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hero-title{
    font-weight: bold;
}
.hero-body{
    font-size: 1.3em; 
    line-height: 1.3em;
}
.section-card {
    min-width: 200px;
    box-shadow: var(--nav-shadow);
    border-radius: 20px;
    overflow: clip;
    transition: all 0.1s ease-in-out;
    position: relative;
}
.section-subtitle{
    font-size: 1.3em;
}
.section-card .img {
    height: 200px;
    width: 100%;
    background: #eee;
    overflow: clip;
    position: relative;
}
.img::after {
    content: '';
    position: absolute;
    background: var(--cfde-blue);
    opacity: 0.1;
    width: 100%;
    height: 100%;
    top: 0;
    z-index: 1;
    left: 0;
    transition: all .2s;
}
.section-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all .2s;
}
.card-img-cite {
    position: absolute;
    bottom: 0;
    white-space: nowrap;
    padding: 10px;
    line-height: 1em;
    display: none;
}
.section-card-info{
    padding: 20px;
    gap: 5px;
    background: var(--cfde-lite-blue);
    color: white;
    flex: 1;
}
.section-card-body{
    font-size: 1em;
    line-height: 1.2em;
}
.section-card:hover {
    cursor: pointer;
    transform: scale(1.01) translateY(-5px);
    box-shadow: rgba(255, 255, 255, 0.1) 0px 1px 1px 0px inset, rgba(50, 50, 93, 0.25) 0px 30px 60px -10px, rgba(0, 0, 0, 0.3) 0px 15px 30px -20px;
}
.section-card:hover .img::after {
    opacity: 0;
}
.section-card:hover img {
    transform: scale(1.05);
    filter: grayscale(0);
}
.section-card:hover .section-card-info{
    background: var(--cfde-blue);
}

.section-card.coming-soon{
    pointer-events: none;
}
.section-card.coming-soon:after {
    content: 'Coming soon';
    position: absolute;
    top: 100px;
    background: #a1a7ab;
    width: 100%;
    text-align: center;
    color: yellow;
    padding: 10px;
    font-weight: bold;
    letter-spacing: .5px;
}
.section-card.coming-soon img {
    filter: grayscale(1);
}
.section-card.coming-soon .section-card-info {
    background: #a1a7ab;
}

.supported{
    background: var(--cfde-lite-blue);
    color: white;
}
.support-item {
    background: white;
    height: 100px;
    border-radius: 10px;
    padding: 10px;
}
.support-item img{
    height: 100%;
    width: auto;
}
@media only screen and (max-width: 900px) {
    .hero-title{
        font-size: 1.8em; 
    }
    .hero-body{
        font-size: 1em; 
    }
    .section-card{
        min-width: 300px;
    }
}
</style>