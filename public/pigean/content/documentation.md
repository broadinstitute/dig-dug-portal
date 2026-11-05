# From genetic evidence to gene relevance

PIGEAN (*Priors Inferred from GEne ANnotations*) combines genetic associations and functional annotations to estimate a gene's relevance to a trait. This guide follows the model in the paper, starting with the intuition behind regularization and ending with the quantities you can explore in the Explorer.

## 1. Why regularization matters

A model can fit observed data closely and still learn the noise. This is especially important when gene annotations are numerous, overlapping, and unevenly distributed across genes. A flexible model may give large weights to incidental patterns or spread the same signal across redundant annotations.

**Regularization constrains that flexibility.** It shrinks uncertain effects and can favor a smaller set of useful annotations. The goal is to retain evidence that generalizes beyond the particular observations used to fit the model. In PIGEAN, genetic evidence helps calibrate which annotations are informative for a particular trait.

<figure>
<video autoplay muted loop controls playsinline preload="metadata" aria-label="Regularization: fitting signal rather than noise">
<source src="./media/regularization.webm" type="video/webm">
Your browser cannot play this video. <a href="./media/regularization.webm">Download the regularization animation.</a>
</video>
<figcaption>Regularization discourages a fit that follows every noisy observation.</figcaption>
</figure>

<details>
<summary>Animation description</summary>
<p>Noisy observations are fit by an overly flexible curve. A regularized fit follows the underlying pattern more smoothly, illustrating why a closer fit to the observed points is not always a better model of the signal.</p>
</details>

## 2. Regularizing gene sets on genetics

For a given trait, PIGEAN assumes that some genes are relevant and that a gene's annotations help explain its probability of relevance. An annotation can be binary, such as membership in a pathway, or real valued, such as an expression-derived measurement.

Each annotation receives a trait-specific effect, $\beta_j$. PIGEAN learns these effects jointly with gene relevance, using genetic association statistics as an anchor. A sparsity prior allows many annotation effects to be zero, while shrinkage constrains the nonzero effects. Annotations that connect genes supported by genetics can then provide **indirect genetic support** for other genes sharing those annotations.

<figure>
<video autoplay muted loop controls playsinline preload="metadata" aria-label="Learning trait-relevant gene-set weights from genetic evidence">
<source src="./media/set_regularization.webm" type="video/webm">
Your browser cannot play this video. <a href="./media/set_regularization.webm">Download the gene-set regularization animation.</a>
</video>
<figcaption>Genetic evidence informs annotation weights, which in turn inform gene relevance.</figcaption>
</figure>

<details>
<summary>Animation description</summary>
<p>The animation connects variant and gene evidence to a collection of gene sets. Learning weights emphasizes the sets that help explain the genetic signal and reduces the influence of other sets. The weighted annotations provide indirect support for their genes.</p>
</details>

## 3. The PIGEAN model

For gene $i$ and trait $T$, let $d_i\in\{0,1\}$ indicate whether the gene is relevant to the trait and let $y_i=\Pr(d_i=1)$. Let $X_{ij}$ encode annotation $j$ for gene $i$. The annotation model specifies the log odds of relevance:

$$
\log\frac{y_i}{1-y_i}
=\sum_j X_{ij}\beta_j+\alpha_i+\log\frac{\pi}{1-\pi}.
$$

Here, $\pi$ is a baseline probability of gene relevance. The paper typically uses 0.05 for complex traits and 0.01 for rare diseases. These are model assumptions, not probabilities assigned by a plot threshold.

The regularization structure is:

$$
\beta_j\sim\delta_j\mathcal{N}(0,\sigma_j^2),\qquad
\delta_j\sim\operatorname{Bernoulli}(p),
$$

$$
\alpha_i=\alpha\sum_j X_{ij},\qquad
\sigma_j^2=\sigma^2\operatorname{Var}_i(X_{ij})^w.
$$

- **$p$ controls sparsity:** the probability an annotation has a nonzero effect; it is learned from the trait's input data.
- **$\sigma$ controls the scale of nonzero effects:** constraining that scale shrinks uncertain annotation effects.
- **$w$ adjusts the effect-size prior for annotation variance.**
- **$\alpha_i$ accounts for a gene's annotation burden** through the sum of its annotation values.

Gene relevance $d$ and annotation effects $\beta$ are latent. PIGEAN uses Gibbs sampling to infer their joint posterior conditional on genetic association statistics $\mathcal{S}$, alternating between updates of gene relevance and annotation effects:

$$
\Pr(d\mid\beta,\mathcal{S})
\quad\text{and}\quad
\Pr(\beta\mid d,\mathcal{S})=\Pr(\beta\mid d).
$$

The methods describe genetic inputs ranging from known disease genes and exome burden statistics to full or partial GWAS summary statistics. Combining evidence sources requires attention to their independence. Annotation-derived support also depends on whether annotations encode prior knowledge of the same disease associations; the paper evaluates this potential circularity explicitly.

<figure>
<video autoplay muted loop controls playsinline preload="metadata" aria-label="The PIGEAN probabilistic model">
<source src="./media/pigean_model.webm" type="video/webm">
Your browser cannot play this video. <a href="./media/pigean_model.webm">Download the PIGEAN model animation.</a>
</video>
<figcaption>The probabilistic model links observed genetic evidence, latent gene relevance, and annotation effects.</figcaption>
</figure>

<details>
<summary>Animation description</summary>
<p>The model diagram brings together genetic evidence for genes, unobserved disease relevance, and effects associated with gene annotations. The dependencies illustrate why gene relevance and annotation effects are inferred together.</p>
</details>

## 4. Decomposing genetic support

The fitted model summarizes evidence at two levels: posterior mean annotation effects, $E[\beta_j]$, and support for individual gene–trait relationships. The paper distinguishes **direct**, **indirect**, and **combined** approximate Bayes factors.

- **Direct support** comes from genetic association evidence for a gene.
- **Indirect support** comes from genetic evidence for other genes, connected through shared annotations.
- **Combined support** integrates both sources. A posterior probability additionally depends on the baseline prior probability.

In the Explorer, `log_bf`, `prior`, and `combined` are the source's direct, indirect, and combined support score fields. The scatter places **indirect support on the horizontal axis** and **direct support on the vertical axis**, matching the animation. These scores are not displayed as posterior probabilities.

<figure>
<video autoplay muted loop controls playsinline preload="metadata" aria-label="Decomposition of direct and indirect genetic support">
<source src="./media/support_decomposition.webm" type="video/webm">
Your browser cannot play this video. <a href="./media/support_decomposition.webm">Download the support decomposition animation.</a>
</video>
<figcaption>Gene–trait pairs occupy different regions according to their direct and indirect support. The animation's thresholds illustrate the decomposition; they are not universal significance cutoffs.</figcaption>
</figure>

<details>
<summary>Animation description</summary>
<p>A scatter plot separates direct genetic support from indirect annotation-derived support. Highlighted examples illustrate convergent support, predominantly direct support, predominantly indirect support, and little support from either source.</p>
</details>

Convergent evidence can connect an association to existing biological knowledge. Strong direct support with little indirect support can reveal a gap in current annotations. Strong indirect support with little direct support can nominate a relationship for further investigation. Each interpretation depends on the model, annotations, and evidence available for the trait.

**[Explore the decomposition of genetic support](#explorer)**: choose a model and phenotype, then select a gene in the scatter or table. Inspect its scores and explore the same gene across traits.

## Reading the published results

The portal offers CFDE v2, small, and large configurations. Their annotation collections and source coverage differ; a model change is a change in the underlying analysis. Some sources omit memberships, run parameters, or full-output ranks. An unavailable result is not a score of zero.

The browser displays records exposed by the selected source. Complete retrieval of those records does not establish that the source retained every row of the original statistical output. Comparisons report ranks within the retrieved results and identify the population used for their summaries.
