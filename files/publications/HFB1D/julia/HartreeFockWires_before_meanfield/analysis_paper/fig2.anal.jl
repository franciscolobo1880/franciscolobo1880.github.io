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
    folder = "results/data/data_figures/fig2/"

    # Hybrid infinite
    path = folder*"hybrid_(L = Inf, α_SM = 40.0, a0 = 10.0, U_SC = -30.0, μ_SC = 20.0, τ = 0.8).dat"
    (params_Hi, Vzs, μs_SM, seis_Hi) =  Serialization.deserialize("$(path)")
    # Hybrid finite
    path = folder*"hybrid_(L = 2000.0, α_SM = 40.0, a0 = 10.0, U_SC = -30.0, μ_SC = 20.0, τ = 0.8).dat"
    (params_Hf, _, _, seis_Hf) =  Serialization.deserialize("$(path)")

    # Intrinsic infinite
    path = folder*"intrinsic_(L = Inf, Nm = 1, α = 40.0, αt = 0.0, a0 = 10.0, U = -7.85).dat"
    (params_Ii, _, μs, seis_Ii) = Serialization.deserialize("$(path)")
    # Intrinsic finite
    path = folder*"intrinsic_(L = 2000.0, Nm = 1, α = 40.0, αt = 0.0, a0 = 10.0, U = -7.85).dat"
    (params_If, _, _, seis_If) = Serialization.deserialize("$(path)")

    # Common paramenters
    L, a0 = params_If.L, params_If.a0
    α, U, = params_If.α, params_If.U
    α_SM, U_SC, μ_SC = α, params_Hf.U_SC, params_Hf.μ_SC
end;

# ----- RECONSTRUCTING THE HAMILTONIANS -----
begin
    # Hybrid infinite
    rhHFB_Hi = reconH(build_selfconsistent_hybrid_wire(L=Inf, a0=a0))
    hHFB_Hi(iVz, iμ) = rhHFB_Hi(; params_Hi..., Vz=Vzs[iVz], µ=µs_SM[iµ], stream=seis_Hi[1][iVz, iμ])
    # Hybrid finite
    rhHFB_Hf = reconH(build_selfconsistent_hybrid_wire(L=L, a0=a0))
    hHFB_Hf(iVz, iμ) = rhHFB_Hf(; params_Hf..., Vz=Vzs[iVz], µ_SM=µs_SM[iµ], stream=seis_Hf[1][iVz, iμ])

    # Intrinsic infinite
    rhHFB_Ii = reconH(build_selfconsistent_intrinsic_wire(L=Inf, Nm=1, a0=a0))
    hHFB_Ii(iVz, iμ) = rhHFB_Ii(; params_Ii..., Vz=Vzs[iVz], µ=µs[iμ], stream=seis_Ii[1][iVz, iμ])
    # Intrisic finite
    rhHFB_If = reconH(build_selfconsistent_intrinsic_wire(L=L, Nm=1, a0=a0))
    hHFB_If(iVz, iμ) = rhHFB_If(; params_If..., Vz=Vzs[iVz], μ=µs[iμ], stream=seis_If[1][iVz, iμ])
end;

# ----- CALCULATING QUANTITIES -----
begin
    # Hybrid infinite
    Ps_Hi = [invariant(hHFB_Hi(iVz, iμ)) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs_SM)]  
    iVz0_H = argmax(replace!([findfirst(x->x==-1.0, Ps_Hi[iVz, :]) for (iVz, Vz) in enumerate(Vzs)], nothing => 0))
    iμ0_H = findall(x->x==-1.0, Ps_Hi[iVz0_H, :])[Int(ceil(end/2))]   
    Ωs_Hi = [Quantica.gap(hHFB_Hi(iVz, iμ0_H)) for (iVz, Vz) in enumerate(Vzs)]

    # Hybrid finite
    Ωs_Hf  = [gapfix(hHFB_Hf, iVz, iμ) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs_SM)]
    b50_Hf = bands(rhHFB_Hf, Vzs; mapping=Vz -> ftuple(;params_Hf..., Vz, μ=μs_SM[iμ0_H], stream=seis_Hf[1][findfirst(x->x==Vz, Vzs), iμ0_H]), solver=solver(50))
    b2_Hf  = bands(rhHFB_Hf, Vzs; mapping=Vz -> ftuple(;params_Hf..., Vz, μ=μs_SM[iμ0_H], stream=seis_Hf[1][findfirst(x->x==Vz, Vzs), iμ0_H]), solver=solver(2))

    # Intrinsic infinite
    Ps_Ii = [invariant(hHFB_Ii(iVz, iμ)) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    iVz0_I = argmax(replace!([findfirst(x->x==-1.0, Ps_Ii[iVz, :]) for (iVz, Vz) in enumerate(Vzs)], nothing => 0))
    iμ0_I = findall(x->x==-1.0, Ps_Ii[iVz0_I, :])[Int(ceil(end/2))]
    Ωs_Ii = [Quantica.gap(hHFB_Ii(iVz, iμ0_I)) for (iVz, Vz) in enumerate(Vzs)]
    # Intrinsic finite
    Ωs_If  = [abs.(real.(energies(spectrum(hHFB_If(iVz, iμ); solver=solver(1)))))[1] for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    b50_If = bands(rhHFB_If, Vzs; mapping=Vz -> ftuple(;params_If..., Vz, μ=μs[iμ0_I], stream=seis_If[1][findfirst(x->x==Vz, Vzs), iμ0_I]), solver=solver(50))
    b2_If  = bands(rhHFB_If, Vzs; mapping=Vz -> ftuple(;params_If..., Vz, μ=μs[iμ0_I], stream=seis_If[1][findfirst(x->x==Vz, Vzs), iμ0_I]), solver=solver(2))
end;

begin
    # --- Minimal ---
    h_Mi = build_minimal_wire(L=Inf, a0=a0)
    h_Mf = build_minimal_wire(L=L, a0=a0)
    params_M = (; α=α, μ=0.0, Δ0=Vzs[iVz0_H])
    Ωs_M = [Quantica.gap(h_Mi(; params_M..., Vz)) for Vz in Vzs]
    b_M = bands(h_Mf, Vzs; mapping=Vz -> ftuple(;params_M..., Vz), solver=solver(50))
    Ps_M(μ, Δ0, μ0) = sqrt((μ-μ0)^2+Δ0^2)

    # --- Analytical ---
    Ωs_A = [analΩ(Vz, μs[iμ0_H], U; ϵ0=4.2, a0) for Vz in Vzs]
end;

# ----- PLOTTING PAPER MAIN FIGURE -----
begin
    fig = Figure(size=(900, 700))
    Label(fig[1, 0], L"\text{\textbf{Finite-length hybrid}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)
    Label(fig[2, 0], L"\text{\textbf{Finite-length intrinsic}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)
    Label(fig[3, 0], L"\text{\textbf{Infinite length}}", padding = (0, 0, 0, 0), rotation=π/2, fontsize=22.5, color=:black)

    # Hybrid phase diagram
    ax = Axis(fig[1, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ_\text{SM}\ \text{(meV)}", titlesize=22.5, xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)    
    hm = heatmap!(ax, Vzs, μs_SM, Ωs_Hf, colormap=cgrad(:inferno, scale=:exp), colorrange=(0,0.401), highclip=cgrad(:inferno, scale=:exp)[end])
    bar = Colorbar(fig[0, 1], hm, vertical=false, label=L"Ω\text{ (meV)}", labelsize=22.5)    
    contour!(ax, Vzs, μs_SM, Ps_Hi, color=:white, linewidth=0.2)
    lines!(Ps_M.(μs_SM, Vzs[iVz0_H], μs_SM[iμ0_H]), μs_SM, color=:white, linestyle=:dash) 
    hlines!(ax, μs_SM[iμ0_H], linestyle=Linestyle([0, 15, 20]), color=:red)
    Label(fig[1, 1, TopLeft()], L"\textbf{(a)}", color=:black, fontsize=22.5, padding = (-45, 0, -25, 0))
    text!(fig[1, 1], L"\text{Trivial}", color=:black, fontsize=25, position=(0.1, -7.3))
    text!(fig[1, 1], L"\text{Topological}", color=:white, fontsize=25, position=(0.575, -7.8))
    hidexdecorations!(ax, ticks=false, minorticks=false)
    xlims!(Vzs[begin], Vzs[end])
    # Hybrid spectrum
    ax = Axis(fig[1, 2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true, yminorgridvisible=true)
    qplot!(b_M, color=:silver, hide=:nodes)
    qplot!(b50_Hf, color=:black, hide=:nodes)
    qplot!(b2_Hf, color=:red, hide=:nodes)    
    vlines!(ax, Vzs[iVz0_H], linestyle=:dot, color=:black) 
    axislegend(ax, [LineElement(color=:black), LineElement(color=:silver)], [L"H^\text{hyb}_\text{HFB}", L"H^\text{OL}"], orientation=:horizontal, position = :rb, labelsize=25, margin=(0, 0, 0, 0))
    text!(fig[1, 2], L"s\text{-wave}", color=:black, fontsize=22.5, position=(0.03, 0.02))
    text!(fig[1, 2], L"p\text{-wave}", color=:black, fontsize=22.5, position=(0.6, 0.02))
    Label(fig[1, 2, Bottom()], L"V_\text{Z}^c", color=:black, fontsize=22.5, padding = (-90, 10, 0, 0))    
    Label(fig[1, 2, TopLeft()], L"\textbf{(b)}", color=:black, fontsize=22.5, padding = (-25, 0, -25, 0))
    ylims!(-0.50, 0.50)
    hidexdecorations!(ax, ticks=false, minorticks=false)
    xlims!(Vzs[begin], Vzs[end])

    # Intrinsic phase diagram
    ax = Axis(fig[2, 1], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel = L"μ\ \text{(meV)}", titlesize=22.5, xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true)
    hm = heatmap!(ax, Vzs, μs, Ωs_If, colormap=cgrad(:inferno, scale=:exp), colorrange=(0,0.401), highclip=cgrad(:inferno, scale=:exp)[end])    
    contour!(ax, Vzs, μs, Ps_Ii, color=:white, linewidth=0.2)
    lines!(Ps_M.(μs, Vzs[iVz0_I], μs[iμ0_I]), μs, color=:white, linestyle=:dash)   
    hlines!(ax, μs[iμ0_I], linestyle=Linestyle([0, 15, 20]), color=:red)
    Label(fig[2, 1, TopLeft()], L"\textbf{(c)}", color=:black, fontsize=22.5, padding = (-45, 0, -25, 0))
    xlims!(Vzs[begin], Vzs[end])
    # Intrinsic spectrum
    ax = Axis(fig[2, 2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"ϵ\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xgridvisible=false, xminorticks=IntervalsBetween(5), yminorticks=IntervalsBetween(5), xminorticksvisible=true, yminorticksvisible=true, yminorgridvisible=true)
    qplot!(b50_If, color=:black, hide=:nodes)
    qplot!(b2_If, color=:red, hide=:nodes)
    vlines!(ax, Vzs[iVz0_I], linestyle=:dot, color=:black) 
    Label(fig[2, 2, Bottom()], L"V_\text{Z}^c", color=:black, fontsize=22.5, padding = (-90, 10, 25, 0))    
    Label(fig[2, 2, TopLeft()], L"\textbf{(d)}", color=:black, fontsize=22.5, padding = (-25, 0, -25, 0))
    ylims!(-0.50, 0.50)
    xlims!(Vzs[begin], Vzs[end])

    # Infinite gap curves
    ax = Axis(fig[3, 1:2], xlabel=L"V_\text{Z}\text{ (meV)}", ylabel=L"Ω\text{ (meV)}", xlabelsize=22.5, ylabelsize=22.5, xminorticks=IntervalsBetween(5), xminorticksvisible=true, xgridvisible=false, ytickformat = "{:.1f}")
    M = lines!(ax, Vzs, Ωs_M, color=:green)    
    H = lines!(ax, Vzs, Ωs_Hi, color=:blue)
    I = lines!(ax, Vzs, Ωs_Ii, color=:red)
    A = lines!(ax, Vzs, Ωs_A, color=:black, linestyle=:dash)
    Legend(fig[3, 1:2], [H, I, M, A], [L"H^\text{hyb}_\text{HFB}", L"H^\text{int}_\text{HFB}", L"H^\text{OL}", L"H^\text{Hub}_\text{BCS}"], orientation=:horizontal, nbanks = 2, margin=(-200, 0, +150, 0), labelsize=25)
    Label(fig[3, 1, TopLeft()], L"\textbf{(e)}", color=:black, fontsize=22.5, padding = (-25, 0, -25, 0))
    xlims!(Vzs[begin], Vzs[end])    
    ylims!(-0.005, Ωs_Hi[1]+0.005)
    
    rowsize!(fig.layout, 1, Aspect(1, 1.0))
    rowsize!(fig.layout, 2, Aspect(1, 1.0))
    rowsize!(fig.layout, 3, Aspect(1, 0.7))
    resize_to_layout!(fig)
    display(fig)
    save("analysis/fig2.png", fig)
end