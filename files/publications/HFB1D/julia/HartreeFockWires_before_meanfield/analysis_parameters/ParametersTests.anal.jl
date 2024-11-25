begin
    using Revise
    using HartreeFockWires
    import Serialization
    using Quantica
    using ProgressMeter
    using CairoMakie
    CairoMakie.activate!(type = "png")
end;

# ----- LOADING DATA -----
begin
    #analysis_tests/tweaking_USM/data/
    path = "analysis_tests/tweaking_αSC_and_gSC/data/hybrid_(L = Inf, a0 = 10.0, USC = -30.0, μSC = 5.0, αSC = 0.0, USM = 0.0, μSM = 0.0, αSM = 40.0, τ = 0.8, αt = 0.0, g = 0.17).dat"
    rhHFB = reconH(build_selfconsistent_hybrid_wire(L=Inf, a0=10.0))
    (params, Vzs, μs, seis) = Serialization.deserialize("$(path)")

    hHFB(iVz, iμ) = rhHFB(; params..., Vz=Vzs[iVz], µ=µs[iμ], stream=seis[1][iVz, iμ])
    Ωs = [Quantica.gap(hHFB(iVz, iμ)) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    Ps = [invariant(hHFB(iVz, iμ)) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    iVz0 = argmax(replace!([findfirst(x->x==-1.0, Ps[iVz, :]) for (iVz, Vz) in enumerate(Vzs)], nothing => 0))
    iμ0 = findall(x->x==-1.0, Ps[iVz0, :])[Int(ceil(end/2))]
    print(length(Vzs), " ", length(μs), " ", μs[iμ0])

    # Oreg-Lutchyn model
    P_M(μ, Δ0, μ0) = sqrt((μ-μ0)^2+Δ0^2)
    Ps_M = P_M.(μs, Vzs[iVz0], μs[iμ0])
    params_M = (; α=40.0, μ=0.0, Δ0=Vzs[iVz0])
    Ωs_M = [Quantica.gap(build_OregLutchyn_wire(L=Inf, a0=10.0)(; params_M..., Vz)) for Vz in Vzs]
    #print("Perfect μ range: ", μs[findall(x->isapprox(x, 1.0; atol=step(μs)), Ps_M)])
end;

# --- Plotting minimal gap phase diagram ---
begin
    fig = Figure(size=(600, 500))
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ\ \text{(meV)}", titlesize=20, xlabelsize=20, ylabelsize=20, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)
    hm = heatmap!(ax, Vzs, μs, Ωs, colormap=cgrad(:inferno, scale=:exp), highclip=cgrad(:inferno, scale=:exp)[end])
    bar = Colorbar(fig[1, 2], hm, label=L"Ω\text{ (meV)}", labelsize=20)    
    contour!(ax, Vzs, μs, Ps, color=:white, linewidth=0.2)
    lines!(Ps_M, μs, color=:white, linestyle=:dash) 
    hlines!(ax, μs[iμ0], linestyle=Linestyle([0, 15, 20]), color=:red)
    xlims!(Vzs[begin], Vzs[end])
    display(fig)
end

# --- Plotting minimal gap linecuts curves ---
begin
    fig = Figure(size=(1000, 800))
    ax = Axis(fig[1, 1:2], title="$params", xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"Ω\text{ (meV)}", titlesize=15, xlabelsize=20, ylabelsize=20, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}")
    lines!(ax, Vzs, Ωs[:, iμ0], color=:red)
    lines!(ax, Vzs, Ωs_M, color=:black, linestyle=:dash)
    scatter!(Vzs, seis[2][:, 1]/(200/Ωs[1, iμ0]), markersize=5, color=:blue)   
    xlims!(Vzs[begin], Vzs[end])    
    ylims!(-0.01, 0.601)

    rowsize!(fig.layout, 1, Aspect(1, 0.7))
    resize_to_layout!(fig)
    display(fig)
    #save("linecut_$params.png", fig)
end

# --- Plotting gif tuning Vz ---
begin
    fig = Figure(size=(1000,500))
    ax = Axis(fig[1, 1], title="$params", ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", titlesize=15, xlabelsize=20, ylabelsize=20, xticks=([-π, -π/2, 0, π/2, π], ["-π", "-π/2", "0", "π/2", "π"]), yticks=(-60:10:60, string.(-60:10:60)))
    record(fig, "bands_$params.gif", framerate = 10, eachindex(Vzs)) do iVz    
        b = bands(hHFB(iVz, iμ0), subdiv(-π, +π, 501))
        empty!(ax)   
        text!(fig[1, 1], "Vz=$(round(Vzs[iVz], digits=3))", color=:red, fontsize=25, position=(1.0, 2.1)) 
        text!(fig[1, 1], "it=$(seis[2][iVz, 1])", color=:red, fontsize=25, position=(1.0, 1.7)) 
        qplot!(b, color=:black, hide=:nodes)
        hlines!([0.0], color=(:black, 0.2))
        xlims!(-π, +π)
        ylims!(-2.5, 2.5)
    end
end

# --- Plotting band structure ---
begin
    fig = Figure(size=(500, 500))
    ax = Axis(fig[1, 1], title="$params", ylabel=L"ϵ\text{ (meV)}", xlabel=L"k \text{ (nm)}^{-1}", titlesize=8, xlabelsize=20, ylabelsize=20, xminorticks=IntervalsBetween(10), xminorticksvisible=true)
    Bs = bands(hHFB(1, iμ0), subdiv(-π, π, 1000))
    qplot!(Bs, hide=:nodes, size=2, color=:black)
    #xlims!(-1.5, 1.5)    
    #ylims!(-3, 3)
    #xlims!(2.45-0.5, 2.45+0.5)    
    hlines!([0.0], color=(:black, 0.2))
    display(fig)
end

# --- Plotting energy dispersion ---
begin
    b50 = bands(rhHFB, Vzs; mapping=Vz -> ftuple(;params..., Vz, μ=μs[1], stream=seis[1][findfirst(x->x==Vz, Vzs), 1]), solver=solver(50))
    b2  = bands(rhHFB, Vzs; mapping=Vz -> ftuple(;params..., Vz, μ=μs[1], stream=seis[1][findfirst(x->x==Vz, Vzs), 1]), solver=solver(2))

    fig = Figure(size=(500, 500))
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true, yminorgridvisible=true)
    qplot!(b50, color=:black, hide=:nodes)
    qplot!(b2, color=:red, hide=:nodes)    
    scatter!(Vzs, seis[2][:, 1]/1000, markersize=10, color=:blue)    
    ylims!(-0.50, 0.50)
    xlims!(Vzs[begin], Vzs[end])
    display(fig)
end

# --- Comparison of various minimal gap linecut curves
begin
    p(αSC, g) = "analysis_tests/tweaking_αSC_and_gSC/data/hybrid_(L = Inf, a0 = 10.0, USC = -30.0, μSC = 5.0, αSC = $(αSC), USM = 0.0, μSM = 0.0, αSM = 40.0, τ = 0.8, αt = 0.0, g = $g).dat"
    paths = vcat(p(0.0, 1.0), p(0.0, 0.17), p(40.0, 1.0), p(40.0, 0.17))

    rhHFB = reconH(build_selfconsistent_hybrid_wire(L=Inf, a0=10.0))
    Ω0s = Vector{Vector{Float64}}(undef, length(paths))
    for i in eachindex(paths)
        (params, Vzs, μs, seis) = Serialization.deserialize(paths[i])
        hHFB(iVz) = rhHFB(; params..., Vz=Vzs[iVz], µ=μs[1], stream=seis[1][iVz, 1])
        Ω0s[i] = [Quantica.gap(hHFB(iVz)) for (iVz, Vz) in enumerate(Vzs)]
    end
end;

begin
    fig = Figure(size=(1000, 800))
    ax = Axis(fig[1, 1:2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"Ω\text{ (meV)}", titlesize=15, xlabelsize=20, ylabelsize=20, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}") 
    Pls = [lines!(ax, Vzs, Ω0s[i], color=[(:black, 0.5), :black, (:red, 0.5), :red][i]) for i in eachindex(paths)]
    Legend(fig[1, 1:2, TopRight()], Pls, [L"(0,1)", L"(0,\frac{1}{6})", L"(40,1)", L"(40,\frac{1}{6})"], L"(α_\text{SC},\frac{g_\text{SC}}{g_\text{SM}})", titleposition = :left, orientation=:horizontal, margin=(-480, 0, -70, 0), titlesize=22.5, labelsize=22.5)
    xlims!(Vzs[begin], Vzs[end])
    ylims!(0, 0.4)
    rowsize!(fig.layout, 1, Aspect(1, 0.7))
    resize_to_layout!(fig)
    display(fig)    
    save("linecuts_$params.png", fig)
end