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
folder = "/home/lobo/.julia/dev/HartreeFockWires/analysis/fig3/"
p(Vparams::Tuple) = folder*"rawdata/intrinsic_(L = Inf, a0 = 10.0, α = 40.0, U = $(Vparams[1]), λ = $(Vparams[2]), nV = $(Vparams[3])).dat" 
paths = p.([(-8.0, 0.0, 0), (-3.91, 5.0, 7), (-4.3, 10.0, 13)])
curves = Serialization.deserialize(folder*"fig3.dat")

begin
    Vzs = curves[1].Vzs; μs=curves[1].μs
    Ω0_OL = calculate_gap_OL(curves[1].iVz0-1, Vzs, curves[1].params)
    labelPD = [L"\textbf{(a)}", L"\textbf{(b)}", L"\textbf{(c)}", L"\textbf{(d)}", L"\textbf{(e)}"]
    cs = [:red, :orange, :limegreen]
    fig = Figure(size=(900, 700))

    # ----- Gap phase diagrams ------
    for i in eachindex(paths)
        λ = Int(curves[i].params.λ)
        ax = Axis(fig[1, i], title=L"$λ = %$λ$\text{ nm}", xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ\ \text{(meV)}", titlesize=20, xlabelsize=20, ylabelsize=20, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)
        hm = heatmap!(ax, Vzs, μs, curves[i].Ω, colormap=cgrad(:inferno, scale=:exp), colorrange=(0.0, 0.4), highclip=cgrad(:inferno, scale=:exp)[end])        
        contour!(ax, Vzs, μs, curves[i].P, color=:white, linewidth=0.2)
        lines!(pfaffian_OL.(μs; μ0=μs[curves[i].iμ0], Vzs, curves[i].iVz0), μs, color=:silver)
        hlines!(ax, μs[curves[i].iμ0], linestyle=Linestyle([0, 15, 20]), color=cs[i])
        #hidexdecorations!(ax, ticklabels=false, ticks=false, minorticks=false)
        isone(i) ? nothing : hideydecorations!(ax, ticks=false, minorticks=false)
        isone(i) ? Colorbar(fig[1, 4], hm, label=L"Ω\text{ (meV)}", labelsize=22.5) : nothing
        labelPDℓ = isone(i) ? -90 : -30 
        labelμ0ℓ = isone(i) ? -40 : 5 
        Label(fig[1, i, TopLeft()], labelPD[i], color=:black, fontsize=22.5, padding = (0, labelPDℓ, 5, 0))
    end

    # ----- Gap curves -----
    ax = Axis(fig[2, 1:length(paths)+1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"Ω\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}")
    for i in eachindex(paths)
        λ = Int(curves[i].params.λ); nV = 1*curves[i].params.nV;
        lines!(ax, Vzs, curves[i].Ω0, color=cs[i], label=L"$λ = %$λ$\text{ nm}") 
    end
    lines!(ax, Vzs, Ω0_OL, color=:silver, label=L"H^\text{OL}")
    axislegend(ax, L"H^\text{int}_\text{HFB}:", titleposition = :left, titlesize=20, labelsize = 20, margin=(0, 0, 0, 0), orientation=:horizontal)
    xlims!(Vzs[begin], Vzs[end])   
    hidexdecorations!(ax, ticks=false, minorticks=false)
    Label(fig[2, 1:length(paths)+1, TopLeft()], labelPD[4], color=:black, fontsize=22.5, padding = (-40, 0, -25, 0))

    ax = Axis(fig[3, 1:length(paths)+1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"\log(Ω)", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}")
    for i in eachindex(paths)
        λ = curves[i].params.λ
        lines!(ax, Vzs, log.(curves[i].Ω0), color=cs[i]) 
    end
    lines!(ax, Vzs, log.(Ω0_OL), color=:silver)
    xlims!(Vzs[begin], Vzs[end])
    ylims!(-4.0, -0.9)
    Label(fig[3, 1:length(paths)+1, TopLeft()], labelPD[5], color=:black, fontsize=22.5, padding = (-40, 0, -25, 0))


    rowsize!(fig.layout, 1, Aspect(1, 1))
    rowsize!(fig.layout, 2, Aspect(1, 1))
    rowsize!(fig.layout, 3, Aspect(1, 1))
    resize_to_layout!(fig)
    display(fig)
    save(folder*"fig3.pdf", fig)
end

begin
    curves = []
    for i in eachindex(paths)
        (params, Vzs, μs, sols) = Serialization.deserialize("$(paths[i])")
        V(r) = Yukawa(r; params)

        h = build_meanfield_intrinsic_wire(L=params.L, a0=params.a0, nV=params.nV)
        ΣMF = build_meanfield_selfenergies(greenfunction(h, GS.Schur()), V; params...)
        hMF = converged_hMF(ΣMF, h, sols, Vzs, μs; params...)
        
        P, iVz0, iμ0, Ω0 = calculate_gap(hMF, Vzs, μs)
        println("μ0 = $(round(μs[iμ0], sigdigits=3))")
        println("Ω(Vz=0) = $(round(Ω0[1], sigdigits=3))")
        Ω = [Quantica.gap(hMF(iVz, iμ); nev=2) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]

        push!(curves, (; params, Vzs, iVz0, μs, iμ0, P, Ω0, Ω))
    end
    Serialization.serialize(folder*"fig3.dat", curves)
end;