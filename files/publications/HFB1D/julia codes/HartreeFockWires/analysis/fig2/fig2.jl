begin
    using Revise
    using HartreeFockWires
    import Serialization
    using Quantica
    using ProgressMeter
    using CairoMakie
    CairoMakie.activate!(type = "png")
end;

# ----- Loading data, reconstruncting Hamiltonians, calculating gaps -----
folder = "/home/lobo/.julia/dev/HartreeFockWires/analysis/fig2/"
pathH(L) = folder*"rawdata/hybrid_(L = $L, a0 = 10.0, αSC = 0.0, αSM = 40.0, g = 0.17, τ = 0.8, μSC = 10.0, USC = -32.0).dat"
pathI(L) = folder*"rawdata/intrinsic_(L = $L, a0 = 10.0, α = 40.0, U = -8.0, λ = 0.0, nV = 0).dat" 

# Importing not working at the moment because Serialization cannot read the BandStructure
#models = Serialization.deserialize(folder*"fig2.dat") # [1], [2], [3], [4] -> Hi, Hf, Ii, If

# OL and BCS comparisons
begin
    L = models[2].params.L; a0 = models[1].params.a0
    iVz0_OL = models[1].iVz0-3
    Ω0_OL = calculate_gap_OL(iVz0_OL, Vzs, models[1].params)
    b_OL = bands(build_OregLutchyn_wire(L=L, a0=a0), Vzs; mapping=Vz -> ftuple(;models[4].params..., Δ0=Vzs[iVz0_OL], Vz), solver=solver(50))
    Ω0_BCS = [BCSΩ(Vz, -models[3].μs[models[3].iμ0], models[3].params.U; ϵ0=0.475, a0) for Vz in Vzs]
end

begin
    cs = [:blue, :red]
    Vzs = models[1].Vzs
    fig = Figure(size=(900, 700))
    Label(fig[1, 0], L"\text{\textbf{Finite-length hybrid}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)
    Label(fig[2, 0], L"\text{\textbf{Finite-length intrinsic}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)
    Label(fig[3, 0], L"\text{\textbf{Infinite length}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)

    # ----- Finite-length plot ------
    for (i, M) in enumerate([2, 4])

        # --- Phase diagrams (Hf, If) ----
        μs = models[M].μs
        labelPD = M == 2 ? L"\textbf{(a)}" : L"\textbf{(c)}"

        ax = Axis(fig[i, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ \text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)
        hm = heatmap!(ax, Vzs, μs, models[M].Ω, colormap=cgrad(:inferno, scale=:exp), colorrange=(0.0, 0.4), highclip=cgrad(:inferno, scale=:exp)[end]) 
        contour!(ax, Vzs, μs, models[M-1].P, color=:white, linewidth=0.2)
        lines!(pfaffian_OL.(μs; μ0=μs[models[M-1].iμ0], Vzs, iVz0=iVz0_OL), μs, color=:silver, linestyle=:dot)
        xlims!(Vzs[begin], Vzs[end])

        hlines!(ax, μs[models[M-1].iμ0], linestyle=Linestyle([0, 15, 20]), color=cs[i])
        Label(fig[i, 1, TopLeft()], labelPD, color=:black, fontsize=22.5, padding = (-45, 0, -25, 0))
        if M == 2
            bar = Colorbar(fig[0, 1], hm, vertical=false, label=L"Ω\text{ (meV)}", labelsize=22.5)
            hidexdecorations!(ax, ticks=false, minorticks=false)
            text!(fig[i, 1], L"\text{Trivial}", color=:black, fontsize=25, position=(0.1, -8.5))
            text!(fig[i, 1], L"\text{Topological}", color=:white, fontsize=25, position=(0.55, -9.0))
        end

        # ----- Spectrums ------
        labelS = M == 2 ? L"\textbf{(b)}" : L"\textbf{(d)}"
        ax = Axis(fig[i, 2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true, yminorgridvisible=true)
        M == 2 ? qplot!(b_OL, color=:silver, hide=:nodes) : nothing
        qplot!(models[M].b, color=:black, hide=:nodes)
        qplot!(models[M].br, color=cs[i], hide=:nodes)    
        vlines!(ax, Vzs[models[M-1].iVz0], linestyle=:dot, color=:black) 

        ylims!(-0.50, 0.50)
        xlims!(Vzs[begin], Vzs[end])
        Label(fig[i, 2, TopLeft()], labelS, color=:black, fontsize=22.5, padding = (-25, 0, -25, 0))
        if M == 2
            axislegend(ax, [LineElement(color=:black), LineElement(color=:silver)], [L"H^\text{hyb}_\text{HFB}", L"H^\text{OL}"], orientation=:horizontal, position = :rb, labelsize=25, margin=(0, 0, 0, 0))
            text!(fig[i, 2], L"s\text{-wave}", color=:black, fontsize=22.5, position=(0.03, 0.02))
            text!(fig[i, 2], L"p\text{-wave}", color=:black, fontsize=22.5, position=(0.6, 0.02))
            hidexdecorations!(ax, ticks=false, minorticks=false)
        end

    end

    # --- Infinite-length curves ---
    ax = Axis(fig[3, 1:2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"Ω\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}")
    M = lines!(ax, Vzs, Ω0_OL, color=:silver)    
    Hf = lines!(ax, Vzs, models[1].Ω0, color=cs[1])
    If = lines!(ax, Vzs, models[3].Ω0, color=cs[2])
    A = lines!(ax, Vzs, Ω0_BCS, color=:black, linestyle=:dash)
    Legend(fig[3, 1:2], [Hf, If, M, A], [L"H^\text{hyb}_\text{HFB}", L"H^\text{int}_\text{HFB}", L"H^\text{OL}", L"H^\text{Hub}_\text{BCS}"], orientation=:horizontal, nbanks = 2, margin=(-200, 0, +150, 0), labelsize=25)
    Label(fig[3, 1, TopLeft()], L"\textbf{(e)}", color=:black, fontsize=22.5, padding = (-25, 0, -25, 0))
    xlims!(Vzs[begin], Vzs[end])    
    ylims!(-0.005, Ω0_OL[1]+0.005)

    rowsize!(fig.layout, 1, Aspect(1, 1.0))
    rowsize!(fig.layout, 2, Aspect(1, 1.0))
    rowsize!(fig.layout, 3, Aspect(1, 0.7))
    resize_to_layout!(fig)
    display(fig)
    save(folder*"fig2.pdf", fig)
end

begin
    models = []

    # --- Hybrid infinite ---
    (params, Vzs, μs, sols) = Serialization.deserialize("$(pathH(Inf))")
    h = build_meanfield_hybrid_wire(L=params.L, a0=params.a0)
    ΣMF = build_meanfield_selfenergies(greenfunction(h, GS.Schur()), nothing; params...)
    hMF = converged_hMF(ΣMF, h, sols, Vzs, μs; params...)
    P, iVz0, iμ0, Ω0 = calculate_gap(hMF, Vzs, μs)
    push!(models, (; params, Vzs, iVz0, μs, iμ0, P, Ω0))
    # --- Hybrid finite ---
    (params, Vzs, μs, sols) = Serialization.deserialize("$(pathH(2000.0))")
    h = build_meanfield_hybrid_wire(L=params.L, a0=params.a0)
    hMF = converged_hMF_npv(h, GS.Spectrum(), nothing, sols, Vzs, μs; params...)
    Ω  = [gapfix(hMF, iVz, iμ) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    br, b = calculate_bands(h, nothing, GS.Spectrum(), sols, Vzs, μs, models[1].iμ0, 50; params...)
    push!(models, (; params, Vzs, μs, Ω, br, b))

    # --- Intrinsic infinite ---
    (params, Vzs, μs, sols) = Serialization.deserialize("$(pathI(Inf))")
    h = build_meanfield_intrinsic_wire(L=params.L, a0=params.a0, nV=params.nV)
    ΣMF = build_meanfield_selfenergies(greenfunction(h, GS.Schur()), nothing; params...)
    hMF = converged_hMF(ΣMF, h, sols, Vzs, μs; params...)
    P, iVz0, iμ0, Ω0 = calculate_gap(hMF, Vzs, μs)
    push!(models, (; params, Vzs, iVz0, μs, iμ0, P, Ω0))
    # --- Intrinsic finite ---
    (params, Vzs, μs, sols) = Serialization.deserialize("$(pathI(2000.0))")
    h = build_meanfield_intrinsic_wire(L=params.L, a0=params.a0, nV=params.nV)
    hMF = converged_hMF_npv(h, GS.Spectrum(), nothing, sols, Vzs, μs; params...)
    Ω = [abs.(real.(energies(spectrum(hMF(iVz, iμ); solver=solver(1)))))[1] for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    br, b = calculate_bands(h, nothing, GS.Spectrum(), sols, Vzs, μs, models[3].iμ0, 50; params...)
    push!(models, (; params, Vzs, μs, Ω, br, b))

    Serialization.serialize(folder*"fig2.dat", models)
end;